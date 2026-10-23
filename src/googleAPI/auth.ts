import * as http from 'http';
import { requestUrl } from 'obsidian';
import type OgTaskPlugin from '../main';

export interface GoogleTokenResponse {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
	token_type?: string;
}

export async function fetchToken(params: Record<string, string>): Promise<GoogleTokenResponse> {
	const res = await requestUrl({
		url: 'https://oauth2.googleapis.com/token',
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(params).toString(),
	});
	return res.json as GoogleTokenResponse;
}

export async function getValidToken(plugin: OgTaskPlugin): Promise<string> {
	const { settings } = plugin;

	if (!settings.refreshToken) {
		throw new Error('No refresh token found. Please connect your Google account in settings.');
	}

	// Use cached accessToken if still valid
	if (settings.accessToken && Date.now() < settings.tokenExpiry) {
		return settings.accessToken;
	}

	// Refresh accessToken
	const tokenData = await fetchToken({
		refresh_token: settings.refreshToken,
		client_id: settings.clientId,
		client_secret: settings.clientSecret,
		grant_type: 'refresh_token',
	});

	settings.accessToken = tokenData.access_token;
	if (tokenData.refresh_token) {
		settings.refreshToken = tokenData.refresh_token;
	}
	settings.tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000;
	await plugin.saveSettings();

	return settings.accessToken;
}

let activeServer: http.Server | null = null;

export function stopAuthServer(): void {
	if (activeServer) {
		try {
			activeServer.close();
		} catch {
			// Ignore if already closed
		}
		activeServer = null;
	}
}

export function listenForAuthCode(port = 42813, timeoutMs = 120000): Promise<string> {
	// If a previous server is still open, close it first
	stopAuthServer();

	return new Promise((resolve, reject) => {
		const server = http.createServer((req, res) => {
			try {
				const url = new URL(req.url ?? '', `http://127.0.0.1:${port}`);
				const code = url.searchParams.get('code');
				const error = url.searchParams.get('error');

				if (error) {
					res.writeHead(400, { 'Content-Type': 'text/html' });
					res.end(`<h1>Auth Failed</h1><p>${error}</p>`);
					stopAuthServer();
					reject(new Error(`OAuth error: ${error}`));
					return;
				}

				if (code) {
					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end('<h1>Auth successful!</h1><p>You can close this tab and return to Obsidian.</p>');
					stopAuthServer();
					resolve(code);
					return;
				}

				// Ignore secondary requests (like /favicon.ico) without closing server
				res.writeHead(404);
				res.end();
			} catch {
				res.writeHead(500);
				res.end();
			}
		});

		activeServer = server;

		const timer = window.setTimeout(() => {
			stopAuthServer();
			reject(new Error('Authentication timed out after 2 minutes.'));
		}, timeoutMs);

		server.listen(port, '127.0.0.1');

		server.on('close', () => {
			window.clearTimeout(timer);
		});

		server.on('error', (err) => {
			window.clearTimeout(timer);
			stopAuthServer();
			reject(err);
		});
	});
}


import { requestUrl, RequestUrlParam } from 'obsidian';
import { getValidToken } from './auth';
import type OgTaskPlugin from '../main';

export class GoogleTasksClient {
	private plugin: OgTaskPlugin;
	private baseUrl = 'https://tasks.googleapis.com/tasks/v1';

	constructor(plugin: OgTaskPlugin) {
		this.plugin = plugin;
	}

	async request<T>(endpoint: string, options: Partial<RequestUrlParam> = {}): Promise<T> {
		const token = await getValidToken(this.plugin);
		const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

		const headers: Record<string, string> = {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			...(options.headers ?? {}),
		};

		const res = await requestUrl({
			url,
			method: options.method ?? 'GET',
			headers,
			body: options.body,
		});

		if (res.status >= 400) {
			throw new Error(`Google Tasks API error (${res.status}): ${res.text}`);
		}

		if (res.status === 204 || !res.text) {
			return undefined as unknown as T;
		}

		return res.json as T;
	}
}

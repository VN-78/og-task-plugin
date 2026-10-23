import OgTaskPlugin from '../main';
import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { listenForAuthCode, fetchToken } from '../googleAPI/auth';

export class SettingTab extends PluginSettingTab {
	plugin: OgTaskPlugin;

	constructor(app: App, plugin: OgTaskPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Google Tasks')
			.setHeading();

		// Status and Account Connection
		const isConnected = Boolean(this.plugin.settings.refreshToken);

		if (isConnected) {
			new Setting(containerEl)
				.setName('Account status')
				.setDesc('Connected to Google Tasks')
				.addButton((button) =>
					button
						.setButtonText('Disconnect')
						.setWarning()
						.onClick(async () => {
							this.plugin.settings.accessToken = '';
							this.plugin.settings.refreshToken = '';
							this.plugin.settings.tokenExpiry = 0;
							await this.plugin.saveSettings();
							new Notice('Disconnected from Google Tasks.');
							this.display();
						})
				);
		} else {
			new Setting(containerEl)
				.setName('Account status')
				.setDesc('Not connected to Google Tasks');
		}

		// 1. Client ID input
		new Setting(containerEl)
			.setName('Client ID')
			.setDesc('Enter your Google Cloud OAuth Client ID')
			.addText((text) =>
				text
					.setPlaceholder('Enter Client ID')
					.setValue(this.plugin.settings.clientId)
					.onChange(async (value) => {
						this.plugin.settings.clientId = value.trim();
						await this.plugin.saveSettings();
					})
			);

		// 2. Client Secret input
		new Setting(containerEl)
			.setName('Client Secret')
			.setDesc('Enter your Google Cloud OAuth Client Secret')
			.addText((text) => {
				text
					.setPlaceholder('Enter Client Secret')
					.setValue(this.plugin.settings.clientSecret)
					.onChange(async (value) => {
						this.plugin.settings.clientSecret = value.trim();
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
			});

		// 3. Connect / Reconnect Button
		new Setting(containerEl)
			.setName(isConnected ? 'Reconnect account' : 'Connect to Google Tasks')
			.setDesc('Authorize Obsidian to access your Google Tasks.')
			.addButton((button) =>
				button
					.setButtonText(isConnected ? 'Reconnect Google Tasks' : 'Connect Google Tasks')
					.setCta()
					.onClick(async () => {
						const { clientId, clientSecret } = this.plugin.settings;

						if (!clientId || !clientSecret) {
							new Notice('Please provide both Client ID and Client Secret first.');
							return;
						}

						const port = 42813;
						const redirectUri = `http://127.0.0.1:${port}`;

						// Build Google Auth URL
						const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
						authUrl.searchParams.set('client_id', clientId);
						authUrl.searchParams.set('redirect_uri', redirectUri);
						authUrl.searchParams.set('response_type', 'code');
						authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/tasks');
						authUrl.searchParams.set('access_type', 'offline');
						authUrl.searchParams.set('prompt', 'consent');

						button.setDisabled(true);
						button.setButtonText('Waiting for authorization...');
						new Notice('Opening browser for Google authorization...');

						try {
							const authPromise = listenForAuthCode(port);
							window.open(authUrl.toString());

							const code = await authPromise;

							button.setButtonText('Exchanging tokens...');
							const tokenData = await fetchToken({
								code,
								client_id: clientId,
								client_secret: clientSecret,
								redirect_uri: redirectUri,
								grant_type: 'authorization_code',
							});

							this.plugin.settings.accessToken = tokenData.access_token;
							if (tokenData.refresh_token) {
								this.plugin.settings.refreshToken = tokenData.refresh_token;
							}
							this.plugin.settings.tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000;
							await this.plugin.saveSettings();

							new Notice('Connected to Google Tasks successfully!');
							this.display();
						} catch (error) {
							console.error('Failed to authenticate with Google Tasks:', error);
							new Notice('Authentication failed. Check developer console for details.');
						} finally {
							button.setDisabled(false);
							button.setButtonText(isConnected ? 'Reconnect Google Tasks' : 'Connect Google Tasks');
						}
					})
			);
	}
}

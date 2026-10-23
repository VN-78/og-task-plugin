import { Plugin, WorkspaceLeaf, } from 'obsidian';
import { TaskView, VIEW_TYPE_TASKS } from './view';
import { SettingTab } from './utils/settingTab';
import { OgTaskSettings, DEFAULT_SETTINGS } from './googleAPI/settings';
import { stopAuthServer } from './googleAPI/auth';

export default class OgTaskPlugin extends Plugin {

	settings!: OgTaskSettings ;
	

	async onload(): Promise<void> {
		await this.loadSettings();
		
		this.addSettingTab(new SettingTab(this.app, this));

		this.registerView(VIEW_TYPE_TASKS, (leaf) => new TaskView(leaf));

		this.addRibbonIcon('check-square', 'Open task', () => {
			void this.activateView();
		});
	}

	onunload(): void {
		stopAuthServer();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData() as Partial<OgTaskSettings>,
		);
	}

	async saveSettings(): Promise<void> {
		
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null =
			workspace.getLeavesOfType(VIEW_TYPE_TASKS)[0] ?? null;

		if (!leaf) {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_TASKS, active: true });
		}
		if (leaf) {
			await workspace.revealLeaf(leaf);
		}
	}
}

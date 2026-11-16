import { Plugin, WorkspaceLeaf, type Editor } from 'obsidian';
import { mount, unmount } from 'svelte';
import { TaskView, VIEW_TYPE_TASKS } from './view';
import { SettingTab } from './utils/settingTab';
import { OgTaskSettings, DEFAULT_SETTINGS } from './settings';
import { stopAuthServer } from './api/auth';
import { taskStore } from './store/tasks.svelte';
import ModalHost from './ui/ModalHost.svelte';
import { TaskMarkdownChild } from './markdown/processor';
import { ListSuggestModal } from './ui/ListSuggestModal';

export default class OgTaskPlugin extends Plugin {
	settings!: OgTaskSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		taskStore.init(this);

		// Mount centralized modal host for dialogs
		const modalContainer = document.body.createDiv('og-task-modal-container');
		const modalComponent = mount(ModalHost, { target: modalContainer });
		this.register(() => {
			void unmount(modalComponent);
			modalContainer.remove();
		});

		this.addSettingTab(new SettingTab(this.app, this));

		this.registerView(VIEW_TYPE_TASKS, (leaf) => new TaskView(leaf));

		this.addRibbonIcon('check-square', 'Open Google tasks', () => {
			void this.activateView();
		});

		// Register commands to insert task table into notes
		this.addCommand({
			id: 'insert-task-table',
			name: 'Insert task table',
			editorCallback: (editor: Editor) => {
				editor.replaceSelection('```google-tasks\n```\n');
			},
		});

		this.addCommand({
			id: 'insert-task-table-from-list',
			name: 'Insert task table from specific list...',
			editorCallback: async (editor: Editor) => {
				if (taskStore.isConnected && taskStore.taskLists.length === 0) {
					await taskStore.loadTaskLists();
				}
				if (taskStore.taskLists.length === 0) {
					editor.replaceSelection('```google-tasks\n```\n');
					return;
				}
				new ListSuggestModal(this.app, taskStore.taskLists, (list) => {
					editor.replaceSelection(`\`\`\`google-tasks\nlist: ${list.title}\n\`\`\`\n`);
				}).open();
			},
		});

		// Editor right-click context menu
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor: Editor) => {
				menu.addItem((item) => {
					item.setTitle('Insert Google tasks table')
						.setIcon('check-square')
						.onClick(() => {
							editor.replaceSelection('```google-tasks\n```\n');
						});
				});
			})
		);

		// Register markdown codeblock processors for note embedding
		this.registerMarkdownCodeBlockProcessor('google-tasks', (source, el, ctx) => {
			const child = new TaskMarkdownChild(el, source);
			ctx.addChild(child);
		});

		this.registerMarkdownCodeBlockProcessor('og-task', (source, el, ctx) => {
			const child = new TaskMarkdownChild(el, source);
			ctx.addChild(child);
		});
	}

	onunload(): void {
		stopAuthServer();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<OgTaskSettings>,
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async activateView(): Promise<void> {
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

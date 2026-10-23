import { ItemView, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import TaskWidget from './ui/TaskWidget.svelte';
import { taskStore } from './store/tasks.svelte';

export const VIEW_TYPE_TASKS = 'og-task-view';

export class TaskView extends ItemView {
	private component: ReturnType<typeof mount> | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_TASKS;
	}

	getDisplayText(): string {
		return 'Google tasks';
	}

	getIcon(): string {
		return 'check-square';
	}

	protected async onOpen(): Promise<void> {
		this.component = mount(TaskWidget, {
			target: this.contentEl,
			props: { app: this.app },
		});

		void taskStore.loadTaskLists();
	}

	protected async onClose(): Promise<void> {
		if (this.component) {
			await unmount(this.component);
			this.component = null;
		}
	}
}

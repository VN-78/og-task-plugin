import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";

import Counter from "./components/Counter.svelte";

export const VIEW_TYPE_TASK = 'og-task-view';

export class CounterView extends ItemView {
	component: Record<string, any> | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_TASK;
	}

	getDisplayText(): string {
		return 'Og-task-view';
	}

	protected async onOpen(): Promise<void> {
		this.component = mount(Counter, {
			target: this.contentEl,
			props: { start: 10},
		})
	}

	protected async onClose(): Promise<void> {
		if (this.component) await unmount(this.component);
	}
}
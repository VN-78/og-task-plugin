import { Plugin, WorkspaceLeaf } from "obsidian";
import { TaskView, VIEW_TYPE_TASKS } from "./view";

export default class OgTaskPlugin extends Plugin {
	async onload(): Promise<void> {
		this.registerView(VIEW_TYPE_TASKS, (leaf) => new TaskView(leaf))

		this.addRibbonIcon("check-square", "Open task", () => {
			void this.activateView();
		});
	}

	async activateView() {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(VIEW_TYPE_TASKS)[0];

		if (!leaf) {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_TASKS, active: true });
		}
		if (leaf) {
			await workspace.revealLeaf(leaf);
		}
	}
}
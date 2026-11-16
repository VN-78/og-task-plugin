import { App, FuzzySuggestModal } from 'obsidian';
import type { GoogleTaskList } from '../api/tasks.api';

export class ListSuggestModal extends FuzzySuggestModal<GoogleTaskList> {
	private lists: GoogleTaskList[];
	private onChoose: (list: GoogleTaskList) => void;

	constructor(app: App, lists: GoogleTaskList[], onChoose: (list: GoogleTaskList) => void) {
		super(app);
		this.lists = lists;
		this.onChoose = onChoose;
		this.setPlaceholder('Select a Google tasks list to insert...');
	}

	getItems(): GoogleTaskList[] {
		return this.lists;
	}

	getItemText(item: GoogleTaskList): string {
		return item.title;
	}

	onChooseItem(item: GoogleTaskList): void {
		this.onChoose(item);
	}
}

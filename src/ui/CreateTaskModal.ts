import { App, Modal, Setting, Notice } from 'obsidian';
import { taskStore } from '../store/tasks.svelte';

export class CreateTaskModal extends Modal {
	private title = '';
	private notes = '';
	private dueDate = '';
	private isSubmitting = false;

	constructor(app: App) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		this.setTitle('Create task');

		// 1. Task Title (Required)
		new Setting(contentEl)
			.setName('Task title')
			.setDesc('What needs to be done?')
			.addText((text) => {
				text
					.setPlaceholder('Review project proposal')
					.setValue(this.title)
					.onChange((val) => {
						this.title = val;
					});
				// Focus immediately
				window.setTimeout(() => text.inputEl.focus(), 50);
				text.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						void this.submit();
					}
				});
			});

		// 2. Details / Notes
		new Setting(contentEl)
			.setName('Details')
			.setDesc('Optional notes or description')
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder('Add details...')
					.setValue(this.notes)
					.onChange((val) => {
						this.notes = val;
					});
				textArea.inputEl.rows = 3;
			});

		// 3. Due Date
		new Setting(contentEl)
			.setName('Due date')
			.setDesc('Optional deadline')
			.addText((text) => {
				text.inputEl.type = 'date';
				text.setValue(this.dueDate).onChange((val) => {
					this.dueDate = val;
				});
			});

		// 4. Action Buttons
		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText('Cancel')
					.onClick(() => this.close())
			)
			.addButton((btn) =>
				btn
					.setButtonText('Create task')
					.setCta()
					.onClick(() => void this.submit())
			);
	}

	private async submit(): Promise<void> {
		if (this.isSubmitting) return;

		const trimmedTitle = this.title.trim();
		if (!trimmedTitle) {
			new Notice('Please enter a task title.');
			return;
		}

		this.isSubmitting = true;

		try {
			let formattedDue: string | undefined = undefined;
			if (this.dueDate) {
				const dateObj = new Date(this.dueDate);
				if (!isNaN(dateObj.getTime())) {
					formattedDue = dateObj.toISOString();
				}
			}

			await taskStore.createTask({
				title: trimmedTitle,
				notes: this.notes.trim() || undefined,
				due: formattedDue,
			});

			this.close();
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to create task: ${msg}`);
		} finally {
			this.isSubmitting = false;
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

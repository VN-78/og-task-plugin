<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { taskStore } from '../store/tasks.svelte';
	import { Notice } from 'obsidian';

	let title = $state('');
	let notes = $state('');
	let dueDate = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (taskStore.isModalOpen) {
			const task = taskStore.editingTask;
			if (task) {
				title = task.title;
				notes = task.notes ?? '';
				if (task.due) {
					try {
						const d = new Date(task.due);
						if (!isNaN(d.getTime())) {
							const year = d.getUTCFullYear();
							const month = String(d.getUTCMonth() + 1).padStart(2, '0');
							const day = String(d.getUTCDate()).padStart(2, '0');
							dueDate = `${year}-${month}-${day}`;
						} else {
							dueDate = '';
						}
					} catch {
						dueDate = '';
					}
				} else {
					dueDate = '';
				}
			} else {
				title = '';
				notes = '';
				dueDate = '';
			}
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (isSubmitting) return;

		const trimmedTitle = title.trim();
		if (!trimmedTitle) {
			new Notice('Please enter a task title.');
			return;
		}

		isSubmitting = true;

		try {
			let formattedDue: string | undefined = undefined;
			if (dueDate) {
				const [y, m, d] = dueDate.split('-').map(Number);
				if (y && m && d) {
					formattedDue = new Date(Date.UTC(y, m - 1, d)).toISOString();
				}
			}

			const finalNotes = notes.trim();

			if (taskStore.editingTask) {
				await taskStore.updateTask(taskStore.editingTask.id, {
					title: trimmedTitle,
					notes: finalNotes || undefined,
					due: formattedDue,
				});
			} else {
				await taskStore.createTask({
					title: trimmedTitle,
					notes: finalNotes || undefined,
					due: formattedDue,
				});
			}

			taskStore.closeModal();
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to save task: ${msg}`);
		} finally {
			isSubmitting = false;
		}
	}
	function focusInput(node: HTMLElement) {
		window.setTimeout(() => node.focus(), 50);
	}
</script>

<Dialog.Root
	open={taskStore.isModalOpen}
	onOpenChange={(open) => {
		if (!open) taskStore.closeModal();
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay class="og-dialog-overlay" />
		<Dialog.Content class="og-dialog-content">
			<div class="og-dialog-header">
				<Dialog.Title class="og-dialog-title">
					{taskStore.editingTask ? 'Edit task' : 'Create task'}
				</Dialog.Title>
				<Dialog.Close class="clickable-icon og-dialog-close-btn" aria-label="Close">
					✕
				</Dialog.Close>
			</div>

			<form onsubmit={handleSubmit} class="og-dialog-form">
				<div class="og-form-group">
					<label for="og-task-title-input" class="og-form-label">Task title *</label>
					<input
						id="og-task-title-input"
						type="text"
						class="og-input"
						placeholder="What needs to be done?"
						bind:value={title}
						required
						use:focusInput
					/>
				</div>

				<div class="og-form-group">
					<label for="og-task-notes-input" class="og-form-label">Description</label>
					<textarea
						id="og-task-notes-input"
						class="og-textarea"
						placeholder="Description..."
						rows={3}
						bind:value={notes}
					></textarea>
				</div>

				<div class="og-form-group">
					<label for="og-task-due-date" class="og-form-label">Due date</label>
					<input
						id="og-task-due-date"
						type="date"
						class="og-input"
						bind:value={dueDate}
					/>
				</div>

				<div class="og-dialog-actions">
					<button
						type="button"
						class="og-btn og-btn-secondary"
						onclick={() => taskStore.closeModal()}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="og-btn og-btn-primary"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Saving...' : taskStore.editingTask ? 'Save changes' : 'Create task'}
					</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.og-dialog-overlay) {
		position: fixed;
		inset: 0;
		z-index: var(--layer-modal, 100);
		background-color: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
	}

	:global(.og-dialog-content) {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		z-index: calc(var(--layer-modal, 100) + 1);
		width: 90%;
		max-width: 440px;
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 10px;
		box-shadow: var(--shadow-l, 0 10px 30px rgba(0, 0, 0, 0.4));
		padding: 24px;
		color: var(--text-normal);
		font-family: var(--font-interface);
	}

	.og-dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	:global(.og-dialog-title) {
		font-size: 17px;
		font-weight: 600;
		margin: 0;
		color: var(--text-normal);
	}

	:global(.og-dialog-close-btn) {
		font-size: 14px;
		padding: 4px 8px;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
	}

	:global(.og-dialog-close-btn:hover) {
		color: var(--text-normal);
		background-color: var(--background-modifier-hover);
	}

	.og-dialog-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.og-form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.og-form-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-muted);
	}

	.og-input,
	.og-textarea {
		width: 100%;
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
		padding: 8px 12px;
		color: var(--text-normal);
		font-size: 13px;
		font-family: inherit;
		box-sizing: border-box;
	}

	.og-input:focus,
	.og-textarea:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
	}

	.og-textarea {
		resize: vertical;
	}

	.og-dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 10px;
	}

	.og-btn {
		padding: 7px 16px;
		font-size: 13px;
		font-weight: 500;
		border-radius: 6px;
		cursor: pointer;
		border: 1px solid transparent;
		transition: background-color 0.15s ease;
	}

	.og-btn-secondary {
		background-color: var(--background-secondary);
		border-color: var(--background-modifier-border);
		color: var(--text-normal);
	}

	.og-btn-secondary:hover {
		background-color: var(--background-modifier-hover);
	}

	.og-btn-primary {
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.og-btn-primary:hover:not(:disabled) {
		background-color: var(--interactive-accent-hover);
	}

	.og-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>

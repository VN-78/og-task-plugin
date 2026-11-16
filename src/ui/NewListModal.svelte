<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { taskStore } from '../store/tasks.svelte';
	import { Notice } from 'obsidian';

	let title = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (taskStore.isNewListModalOpen) {
			title = '';
		}
	});

	function focusInput(node: HTMLElement) {
		window.setTimeout(() => node.focus(), 50);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (isSubmitting) return;

		const trimmed = title.trim();
		if (!trimmed) {
			new Notice('Please enter a list title.');
			return;
		}

		isSubmitting = true;
		try {
			await taskStore.createTaskList(trimmed);
			taskStore.closeNewListModal();
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to create list: ${msg}`);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog.Root
	open={taskStore.isNewListModalOpen}
	onOpenChange={(open) => {
		if (!open) taskStore.closeNewListModal();
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay class="og-dialog-overlay" />
		<Dialog.Content class="og-dialog-content">
			<div class="og-dialog-header">
				<Dialog.Title class="og-dialog-title">Create new list</Dialog.Title>
				<Dialog.Close class="clickable-icon og-dialog-close-btn" aria-label="Close">
					✕
				</Dialog.Close>
			</div>

			<form onsubmit={handleSubmit} class="og-dialog-form">
				<div class="og-form-group">
					<label for="og-new-list-title-input" class="og-form-label">List title *</label>
					<input
						id="og-new-list-title-input"
						type="text"
						class="og-input"
						placeholder="e.g., Groceries, Work, Vacation"
						bind:value={title}
						required
						use:focusInput
					/>
				</div>

				<div class="og-dialog-actions">
					<button
						type="button"
						class="og-btn og-btn-secondary"
						onclick={() => taskStore.closeNewListModal()}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="og-btn og-btn-primary"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Creating...' : 'Create list'}
					</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

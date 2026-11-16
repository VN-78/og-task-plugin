<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { taskStore } from '../store/tasks.svelte';
	import { Notice } from 'obsidian';

	let title = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (taskStore.isRenameModalOpen) {
			title = taskStore.activeListTitle;
		}
	});

	function focusInput(node: HTMLElement) {
		window.setTimeout(() => {
			node.focus();
			if (node instanceof HTMLInputElement) {
				node.select();
			}
		}, 50);
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
			await taskStore.renameActiveList(trimmed);
			taskStore.closeRenameModal();
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to rename list: ${msg}`);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog.Root
	open={taskStore.isRenameModalOpen}
	onOpenChange={(open) => {
		if (!open) taskStore.closeRenameModal();
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay class="og-dialog-overlay" />
		<Dialog.Content class="og-dialog-content">
			<div class="og-dialog-header">
				<Dialog.Title class="og-dialog-title">Rename list</Dialog.Title>
				<Dialog.Close class="clickable-icon og-dialog-close-btn" aria-label="Close">
					✕
				</Dialog.Close>
			</div>

			<form onsubmit={handleSubmit} class="og-dialog-form">
				<div class="og-form-group">
					<label for="og-rename-list-title-input" class="og-form-label">List title *</label>
					<input
						id="og-rename-list-title-input"
						type="text"
						class="og-input"
						placeholder="List name"
						bind:value={title}
						required
						use:focusInput
					/>
				</div>

				<div class="og-dialog-actions">
					<button
						type="button"
						class="og-btn og-btn-secondary"
						onclick={() => taskStore.closeRenameModal()}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="og-btn og-btn-primary"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Saving...' : 'Save'}
					</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

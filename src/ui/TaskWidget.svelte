<script lang="ts">
	import { App } from 'obsidian';
	import { taskStore } from '../store/tasks.svelte';
	import { CreateTaskModal } from './CreateTaskModal';

	let { app }: { app: App } = $props();

	function openCreateModal() {
		new CreateTaskModal(app).open();
	}

	function handleListChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		void taskStore.switchList(target.value);
	}

	function formatDate(dueStr?: string): string {
		if (!dueStr) return '';
		try {
			const d = new Date(dueStr);
			if (isNaN(d.getTime())) return '';
			return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
		} catch {
			return '';
		}
	}
</script>

<div class="og-task-container">
	{#if !taskStore.isConnected}
		<div class="og-task-disconnected">
			<div class="og-task-disconnected-icon">📋</div>
			<h3>Connect Google Tasks</h3>
			<p>Link your Google account in Settings to view and sync your tasks here.</p>
		</div>
	{:else}
		<!-- Header (Google Tasks Mobile Widget Style) -->
		<div class="og-task-header">
			<div class="og-task-header-left">
				{#if taskStore.taskLists.length > 1}
					<select
						class="dropdown og-task-select"
						value={taskStore.activeListId}
						onchange={handleListChange}
					>
						{#each taskStore.taskLists as list (list.id)}
							<option value={list.id}>{list.title}</option>
						{/each}
					</select>
				{:else if taskStore.taskLists.length === 1}
					<span class="og-task-title">{taskStore.taskLists[0]?.title ?? 'My Tasks'}</span>
				{:else}
					<span class="og-task-title">Google Tasks</span>
				{/if}
			</div>

			<div class="og-task-header-right">
				<button
					class="clickable-icon og-task-refresh-btn"
					aria-label="Refresh tasks"
					onclick={() => taskStore.loadActiveTasks()}
				>
					↻
				</button>
				<button
					class="mod-cta og-task-add-btn"
					aria-label="Add task"
					onclick={openCreateModal}
				>
					+ Add task
				</button>
			</div>
		</div>

		<!-- Task Body -->
		{#if taskStore.isLoading}
			<div class="og-task-loading">Loading tasks...</div>
		{:else if taskStore.error}
			<div class="og-task-error">
				<p>{taskStore.error}</p>
				<button onclick={() => taskStore.loadActiveTasks()}>Retry</button>
			</div>
		{:else}
			<div class="og-task-list">
				{#if taskStore.activeTasks.length === 0}
					<div class="og-task-empty">
						<span>🎉</span>
						<p>All tasks completed!</p>
					</div>
				{:else}
					{#each taskStore.activeTasks as task (task.id)}
						<div class="og-task-item">
							<input
								type="checkbox"
								class="task-list-item-checkbox og-task-checkbox"
								checked={false}
								onchange={() => taskStore.toggleTask(task)}
							/>
							<div class="og-task-content">
								<span class="og-task-item-title">{task.title}</span>
								{#if task.notes || task.due}
									<div class="og-task-item-meta">
										{#if task.due}
											<span class="og-task-due">📅 {formatDate(task.due)}</span>
										{/if}
										{#if task.notes}
											<span class="og-task-notes-badge" title={task.notes}>📝 Notes</span>
										{/if}
									</div>
								{/if}
							</div>
							<button
								class="clickable-icon og-task-delete-btn"
								aria-label="Delete task"
								onclick={() => taskStore.deleteTask(task.id)}
							>
								✕
							</button>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Completed Tasks Section (Max 5 items) -->
			<div class="og-task-completed-section">
				<button
					class="og-task-completed-toggle"
					onclick={() => taskStore.toggleShowCompleted()}
				>
					<span class="og-task-chevron">{taskStore.showCompleted ? '▼' : '▶'}</span>
					<span>Completed</span>
					{#if taskStore.completedTasks.length > 0}
						<span class="og-task-completed-count">({taskStore.completedTasks.length})</span>
					{/if}
				</button>

				{#if taskStore.showCompleted}
					{#if taskStore.isLoadingCompleted}
						<div class="og-task-loading-sub">Loading completed...</div>
					{:else if taskStore.completedTasks.length === 0}
						<div class="og-task-empty-sub">No recently completed tasks</div>
					{:else}
						<div class="og-task-completed-list">
							{#each taskStore.completedTasks as completedTask (completedTask.id)}
								<div class="og-task-item mod-completed">
									<input
										type="checkbox"
										class="task-list-item-checkbox og-task-checkbox"
										checked={true}
										onchange={() => taskStore.toggleTask(completedTask)}
									/>
									<div class="og-task-content">
										<span class="og-task-item-title is-completed">{completedTask.title}</span>
									</div>
									<button
										class="clickable-icon og-task-delete-btn"
										aria-label="Delete task"
										onclick={() => taskStore.deleteTask(completedTask.id)}
									>
										✕
									</button>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.og-task-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 12px;
		color: var(--text-normal);
		font-family: var(--font-interface);
		gap: 12px;
		overflow-y: auto;
	}

	.og-task-disconnected {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		height: 80%;
		padding: 24px;
		color: var(--text-muted);
	}

	.og-task-disconnected-icon {
		font-size: 40px;
		margin-bottom: 12px;
	}

	.og-task-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--background-modifier-border);
		gap: 8px;
	}

	.og-task-header-left {
		flex: 1;
		min-width: 0;
	}

	.og-task-select {
		max-width: 100%;
		font-weight: 600;
		font-size: 14px;
		background: transparent;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		color: var(--text-normal);
		cursor: pointer;
		padding: 4px 8px;
	}

	.og-task-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-normal);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.og-task-header-right {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.og-task-refresh-btn {
		font-size: 16px;
		padding: 4px 8px;
		cursor: pointer;
		color: var(--text-muted);
		border-radius: 4px;
	}

	.og-task-refresh-btn:hover {
		color: var(--text-normal);
		background-color: var(--background-modifier-hover);
	}

	.og-task-add-btn {
		font-size: 12px;
		font-weight: 500;
		padding: 4px 10px;
		border-radius: 6px;
		cursor: pointer;
		white-space: nowrap;
	}

	.og-task-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.og-task-item {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 6px 8px;
		border-radius: 6px;
		transition: background-color 0.15s ease;
	}

	.og-task-item:hover {
		background-color: var(--background-modifier-hover);
	}

	.og-task-checkbox {
		margin-top: 3px;
		cursor: pointer;
	}

	.og-task-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.og-task-item-title {
		font-size: 13px;
		line-height: 1.4;
		word-break: break-word;
	}

	.og-task-item-title.is-completed {
		text-decoration: line-through;
		color: var(--text-muted);
	}

	.og-task-item-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		color: var(--text-muted);
	}

	.og-task-due {
		color: var(--text-accent);
	}

	.og-task-notes-badge {
		opacity: 0.8;
	}

	.og-task-delete-btn {
		opacity: 0;
		padding: 2px 6px;
		font-size: 12px;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 4px;
	}

	.og-task-item:hover .og-task-delete-btn {
		opacity: 0.8;
	}

	.og-task-delete-btn:hover {
		opacity: 1 !important;
		color: var(--text-error);
	}

	.og-task-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 32px 0;
		color: var(--text-muted);
		gap: 6px;
		font-size: 13px;
	}

	.og-task-empty span {
		font-size: 24px;
	}

	.og-task-loading,
	.og-task-loading-sub {
		padding: 16px;
		text-align: center;
		color: var(--text-muted);
		font-size: 12px;
	}

	.og-task-error {
		padding: 12px;
		color: var(--text-error);
		font-size: 13px;
	}

	.og-task-completed-section {
		margin-top: 10px;
		padding-top: 8px;
		border-top: 1px solid var(--background-modifier-border);
	}

	.og-task-completed-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		box-shadow: none;
		color: var(--text-muted);
		font-size: 12px;
		font-weight: 500;
		padding: 4px 0;
		cursor: pointer;
	}

	.og-task-completed-toggle:hover {
		color: var(--text-normal);
	}

	.og-task-chevron {
		font-size: 10px;
	}

	.og-task-completed-count {
		opacity: 0.7;
	}

	.og-task-completed-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 6px;
	}

	.og-task-empty-sub {
		padding: 8px 0;
		color: var(--text-faint);
		font-size: 11px;
		font-style: italic;
	}
</style>

<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { taskStore } from '../store/tasks.svelte';
	import { getDueInfo } from '../utils/date';
	import { ICONS } from '../utils/icons';

	let { app = undefined }: { app?: unknown } = $props();

	let activeListTitle = $derived(taskStore.activeListTitle);
</script>

<div class="og-task-container">
	{#if !taskStore.isConnected}
		<div class="og-task-disconnected">
			<div class="og-task-disconnected-icon">{@html ICONS.clipboardList}</div>
			<h3>Connect Google Tasks</h3>
			<p>Link your Google account in Settings to view and sync your tasks here.</p>
		</div>
	{:else}
		<!-- Header with Bits UI DropdownMenu for Lists & More Options -->
		<div class="og-task-header">
			<div class="og-task-header-left">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="og-dropdown-trigger" aria-label="Select task list">
						<span class="og-dropdown-trigger-text">{activeListTitle}</span>
						<span class="og-dropdown-trigger-icon">{@html ICONS.chevronDown}</span>
					</DropdownMenu.Trigger>

					<DropdownMenu.Portal>
						<DropdownMenu.Content class="og-dropdown-content" sideOffset={5} align="start">
							<div class="og-dropdown-items-group">
								{#each taskStore.taskLists as list (list.id)}
									<DropdownMenu.Item
										class="og-dropdown-item {list.id === taskStore.activeListId ? 'is-selected' : ''}"
										onSelect={() => void taskStore.switchList(list.id)}
									>
										<span class="og-dropdown-item-check">
											{#if list.id === taskStore.activeListId}
												{@html ICONS.check}
											{/if}
										</span>
										<span class="og-dropdown-item-title">{list.title}</span>
									</DropdownMenu.Item>
								{/each}
							</div>

							<DropdownMenu.Separator class="og-dropdown-separator" />

							<DropdownMenu.Item
								class="og-dropdown-item og-dropdown-item-action"
								onSelect={() => taskStore.openNewListModal()}
							>
								<span class="og-dropdown-action-icon">{@html ICONS.plus}</span>
								<span>New list</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			</div>

			<div class="og-task-header-right">
				<!-- List More Options (⋮) Menu -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="clickable-icon og-task-icon-btn" aria-label="List options">
						{@html ICONS.moreVertical}
					</DropdownMenu.Trigger>

					<DropdownMenu.Portal>
						<DropdownMenu.Content class="og-dropdown-content" sideOffset={5} align="end">
							<div class="og-dropdown-section-label">Sort by</div>
							<DropdownMenu.Item
								class="og-dropdown-item {taskStore.sortBy === 'myOrder' ? 'is-selected' : ''}"
								onSelect={() => taskStore.setSortBy('myOrder')}
							>
								<span class="og-dropdown-item-check">
									{#if taskStore.sortBy === 'myOrder'}
										{@html ICONS.check}
									{/if}
								</span>
								<span>My order</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item
								class="og-dropdown-item {taskStore.sortBy === 'date' ? 'is-selected' : ''}"
								onSelect={() => taskStore.setSortBy('date')}
							>
								<span class="og-dropdown-item-check">
									{#if taskStore.sortBy === 'date'}
										{@html ICONS.check}
									{/if}
								</span>
								<span>Date</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item
								class="og-dropdown-item {taskStore.sortBy === 'title' ? 'is-selected' : ''}"
								onSelect={() => taskStore.setSortBy('title')}
							>
								<span class="og-dropdown-item-check">
									{#if taskStore.sortBy === 'title'}
										{@html ICONS.check}
									{/if}
								</span>
								<span>Title</span>
							</DropdownMenu.Item>

							<DropdownMenu.Separator class="og-dropdown-separator" />

							<DropdownMenu.Item
								class="og-dropdown-item"
								onSelect={() => taskStore.openRenameModal()}
							>
								<span class="og-dropdown-action-icon">{@html ICONS.edit}</span>
								<span>Rename list</span>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								class="og-dropdown-item {taskStore.isDefaultList ? 'is-disabled' : 'is-destructive'}"
								disabled={taskStore.isDefaultList}
								onSelect={() => {
									if (!taskStore.isDefaultList) {
										void taskStore.deleteActiveList();
									}
								}}
							>
								<span class="og-dropdown-action-icon">{@html ICONS.trash}</span>
								<span>Delete list</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>

				<button
					class="clickable-icon og-task-icon-btn"
					aria-label="Refresh tasks"
					onclick={() => taskStore.loadActiveTasks()}
				>
					{@html ICONS.refresh}
				</button>
				<button
					class="mod-cta og-task-add-btn"
					aria-label="Add task"
					onclick={() => taskStore.openCreateModal()}
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
				<button class="og-btn og-btn-secondary" onclick={() => taskStore.loadActiveTasks()}>Retry</button>
			</div>
		{:else}
			<div class="og-task-list">
				{#if taskStore.sortedActiveTasks.length === 0}
					<div class="og-task-empty">
						<p>No active tasks in this list</p>
					</div>
				{:else}
					{#each taskStore.sortedActiveTasks as task (task.id)}
						{@const dueInfo = getDueInfo(task.due)}
						<div class="og-task-item">
							<input
								type="checkbox"
								class="task-list-item-checkbox og-task-checkbox"
								checked={false}
								onchange={() => taskStore.toggleTask(task)}
								aria-label="Mark task completed"
							/>

							<div
								class="og-task-content"
								role="button"
								tabindex="0"
								onclick={() => taskStore.openEditModal(task)}
								onkeydown={(e) => {
									if (e.key === 'Enter') taskStore.openEditModal(task);
								}}
							>
								<span class="og-task-item-title">{task.title}</span>
								{#if dueInfo || task.notes}
									<div class="og-task-item-meta">
										{#if dueInfo}
											<span class="og-task-due {dueInfo.isOverdue ? 'is-overdue' : ''}">
												<span class="og-meta-icon">{@html ICONS.calendar}</span>
												<span>{dueInfo.text}</span>
											</span>
										{/if}
										{#if task.notes}
											<span class="og-task-notes-badge" title={task.notes}>
												<span class="og-meta-icon">{@html ICONS.notes}</span>
												<span>Notes</span>
											</span>
										{/if}
									</div>
								{/if}
							</div>

							<div class="og-task-actions">
								<button
									class="clickable-icon og-task-action-btn"
									aria-label="Edit task"
									onclick={() => taskStore.openEditModal(task)}
								>
									{@html ICONS.edit}
								</button>
								<button
									class="clickable-icon og-task-action-btn is-delete"
									aria-label="Delete task"
									onclick={() => taskStore.deleteTask(task.id)}
								>
									{@html ICONS.trash}
								</button>
							</div>
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
					<span class="og-task-chevron">
						{@html taskStore.showCompleted ? ICONS.chevronDown : ICONS.chevronUp}
					</span>
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
								<div class="og-task-item is-completed-row">
									<input
										type="checkbox"
										class="task-list-item-checkbox og-task-checkbox"
										checked={true}
										onchange={() => taskStore.toggleTask(completedTask)}
										aria-label="Mark task incomplete"
									/>
									<span class="og-task-item-title is-completed">{completedTask.title}</span>
									<div class="og-task-actions">
										<button
											class="clickable-icon og-task-action-btn"
											aria-label="Edit task"
											onclick={() => taskStore.openEditModal(completedTask)}
										>
											{@html ICONS.edit}
										</button>
										<button
											class="clickable-icon og-task-action-btn is-delete"
											aria-label="Delete task"
											onclick={() => taskStore.deleteTask(completedTask.id)}
										>
											{@html ICONS.trash}
										</button>
									</div>
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

	/* Dropdown Trigger */
	:global(.og-dropdown-trigger) {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
		padding: 4px 10px;
		color: var(--text-normal);
		cursor: pointer;
		font-size: 13px;
		font-weight: 600;
		max-width: 100%;
		box-sizing: border-box;
		transition: background-color 0.15s ease;
	}

	:global(.og-dropdown-trigger:hover) {
		background-color: var(--background-modifier-hover);
	}

	.og-dropdown-trigger-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.og-dropdown-trigger-icon {
		display: flex;
		align-items: center;
		opacity: 0.7;
	}

	/* Dropdown Menu Content */
	:global(.og-dropdown-content) {
		z-index: var(--layer-popover, 80);
		min-width: 190px;
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 8px;
		box-shadow: var(--shadow-s, 0 4px 16px rgba(0, 0, 0, 0.25));
		padding: 4px;
		display: flex;
		flex-direction: column;
	}

	.og-dropdown-section-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 6px 10px 4px 10px;
	}

	.og-dropdown-items-group {
		display: flex;
		flex-direction: column;
	}

	:global(.og-dropdown-item) {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px;
		font-size: 13px;
		border-radius: 4px;
		color: var(--text-normal);
		cursor: pointer;
		outline: none;
		user-select: none;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.og-dropdown-items-group :global(.og-dropdown-item:last-child) {
		border-bottom: none;
	}

	:global(.og-dropdown-item:hover),
	:global(.og-dropdown-item[data-highlighted]) {
		background-color: var(--background-modifier-hover);
	}

	:global(.og-dropdown-item.is-selected) {
		font-weight: 600;
		color: var(--interactive-accent);
	}

	:global(.og-dropdown-item.is-disabled) {
		opacity: 0.4;
		cursor: not-allowed;
	}

	:global(.og-dropdown-item.is-destructive:hover) {
		color: var(--text-error, #f87171);
	}

	:global(.og-dropdown-separator) {
		height: 1px;
		background-color: var(--background-modifier-border);
		margin: 4px 0;
	}

	:global(.og-dropdown-item-action) {
		border-bottom: none !important;
		color: var(--text-accent);
		font-weight: 500;
	}

	.og-dropdown-action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 14px;
	}

	.og-dropdown-item-check {
		width: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.og-dropdown-item-title {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.og-task-header-right {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.og-task-icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px 6px;
		cursor: pointer;
		color: var(--text-muted);
		border-radius: 4px;
	}

	.og-task-icon-btn:hover {
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

	/* Simple Clean Task Row */
	.og-task-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.og-task-item {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 7px 8px;
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
		cursor: pointer;
		outline: none;
	}

	.og-task-item-title {
		font-size: 13px;
		line-height: 1.4;
		word-break: break-word;
		color: var(--text-normal);
	}

	.og-task-item.is-completed-row .og-task-item-title {
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
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--text-muted);
	}

	.og-task-due.is-overdue {
		color: var(--text-error, #f87171);
		font-weight: 600;
	}

	.og-task-notes-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		opacity: 0.8;
	}

	.og-meta-icon {
		display: inline-flex;
		align-items: center;
	}

	.og-task-actions {
		display: flex;
		align-items: center;
		gap: 2px;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.og-task-item:hover .og-task-actions {
		opacity: 1;
	}

	.og-task-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3px 5px;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 4px;
	}

	.og-task-action-btn:hover {
		color: var(--text-normal);
		background-color: var(--background-modifier-border);
	}

	.og-task-action-btn.is-delete:hover {
		color: var(--text-error, #f87171);
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

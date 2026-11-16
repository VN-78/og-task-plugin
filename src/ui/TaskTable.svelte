<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { taskStore } from '../store/tasks.svelte';
	import { getDueInfo } from '../utils/date';
	import { ICONS } from '../utils/icons';
	import type { TaskTableConfig } from '../markdown/processor';

	let { config = {} }: { config?: TaskTableConfig } = $props();

	type FilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
	let activeFilter = $state<FilterType>('all');
	let searchQuery = $state<string>('');
	let expandedTaskIds = $state<Record<string, boolean>>({});

	// Initialize & sync config props
	$effect(() => {
		if (config.filter) {
			activeFilter = config.filter;
		}
		if (config.search !== undefined) {
			searchQuery = config.search;
		}
	});

	// Pinned list initialization
	$effect(() => {
		if (config.list && taskStore.taskLists.length > 0) {
			const targetName = config.list.trim().toLowerCase();
			const matched = taskStore.taskLists.find((l) => l.title.trim().toLowerCase() === targetName);
			if (matched && matched.id !== taskStore.activeListId) {
				void taskStore.switchList(matched.id);
			}
		}
	});

	// Lazy load completed tasks when user switches to 'completed' tab
	$effect(() => {
		if (activeFilter === 'completed' && taskStore.completedTasks.length === 0) {
			void taskStore.loadCompletedTasks();
		}
	});

	function toggleExpand(taskId: string) {
		expandedTaskIds[taskId] = !expandedTaskIds[taskId];
	}

	let displayedTasks = $derived.by(() => {
		const isCompletedTab = activeFilter === 'completed';
		const baseTasks = isCompletedTab ? taskStore.completedTasks : taskStore.sortedActiveTasks;

		return baseTasks.filter((task) => {
			// Tab filtering
			if (!isCompletedTab) {
				const due = getDueInfo(task.due);
				if (activeFilter === 'today') {
					if (!due || !due.isToday) return false;
				} else if (activeFilter === 'upcoming') {
					if (!due || due.isOverdue || due.isToday) return false;
				} else if (activeFilter === 'overdue') {
					if (!due || !due.isOverdue) return false;
				}
			}

			// Text search filtering
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const matchesTitle = task.title.toLowerCase().includes(q);
				const matchesNotes = task.notes ? task.notes.toLowerCase().includes(q) : false;
				if (!matchesTitle && !matchesNotes) return false;
			}

			return true;
		});
	});

	let activeListTitle = $derived(
		config.title || taskStore.activeListTitle
	);
</script>

<div class="og-table-container">
	{#if !taskStore.isConnected}
		<div class="og-table-disconnected">
			<div class="og-table-empty-icon">{@html ICONS.clipboardList}</div>
			<div class="og-table-empty-title">Google Tasks Disconnected</div>
			<p>Connect your Google account in Settings to view and sync tasks.</p>
		</div>
	{:else}
		<!-- Desktop Task App Toolbar -->
		<div class="og-table-toolbar">
			<div class="og-toolbar-left">
				<!-- List Switcher Dropdown -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="og-list-badge" aria-label="Select task list">
						<span class="og-list-badge-title">{activeListTitle}</span>
						<span class="og-badge-chevron">{@html ICONS.chevronDown}</span>
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

				<!-- List Options (⋮) Menu -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="clickable-icon og-toolbar-icon-btn" aria-label="List options">
						{@html ICONS.moreVertical}
					</DropdownMenu.Trigger>

					<DropdownMenu.Portal>
						<DropdownMenu.Content class="og-dropdown-content" sideOffset={5} align="start">
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
			</div>

			<!-- Filter Tabs -->
			<div class="og-filter-tabs">
				<button
					class="og-tab-btn {activeFilter === 'all' ? 'is-active' : ''}"
					onclick={() => (activeFilter = 'all')}
				>
					All
				</button>
				<button
					class="og-tab-btn {activeFilter === 'today' ? 'is-active' : ''}"
					onclick={() => (activeFilter = 'today')}
				>
					Today
				</button>
				<button
					class="og-tab-btn {activeFilter === 'upcoming' ? 'is-active' : ''}"
					onclick={() => (activeFilter = 'upcoming')}
				>
					Upcoming
				</button>
				<button
					class="og-tab-btn {activeFilter === 'overdue' ? 'is-active' : ''}"
					onclick={() => (activeFilter = 'overdue')}
				>
					Overdue
				</button>
				<button
					class="og-tab-btn {activeFilter === 'completed' ? 'is-active' : ''}"
					onclick={() => (activeFilter = 'completed')}
				>
					Completed
				</button>
			</div>

			<!-- Right Actions & Search -->
			<div class="og-toolbar-right">
				<div class="og-search-box">
					<span class="og-search-icon">{@html ICONS.search}</span>
					<input
						type="text"
						class="og-search-input"
						placeholder="Search tasks..."
						bind:value={searchQuery}
					/>
				</div>

				<button
					class="clickable-icon og-toolbar-icon-btn"
					aria-label="Refresh tasks"
					onclick={() => {
						void taskStore.loadActiveTasks();
						if (activeFilter === 'completed') void taskStore.loadCompletedTasks();
					}}
				>
					{@html ICONS.refresh}
				</button>

				<button
					class="mod-cta og-table-add-btn"
					aria-label="Add task"
					onclick={() => taskStore.openCreateModal()}
				>
					<span class="og-btn-icon">{@html ICONS.plus}</span>
					<span>Add task</span>
				</button>
			</div>
		</div>

		<!-- Table Data Grid -->
		<div class="og-table-wrapper">
			<table class="og-table">
				<thead>
					<tr>
						<th class="og-th-status">Status</th>
						<th class="og-th-title">Task</th>
						<th class="og-th-due">Due date</th>
						<th class="og-th-actions">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if taskStore.isLoading}
						<tr>
							<td colspan="4" class="og-table-cell-empty">Loading tasks...</td>
						</tr>
					{:else if displayedTasks.length === 0}
						<tr>
							<td colspan="4" class="og-table-cell-empty">
								No tasks found matching this view.
							</td>
						</tr>
					{:else}
						{#each displayedTasks as task (task.id)}
							{@const dueInfo = getDueInfo(task.due)}
							{@const isDone = task.status === 'completed'}
							{@const isExpanded = Boolean(expandedTaskIds[task.id])}
							<tr class="og-table-row {isDone ? 'is-completed' : ''}">
								<!-- Checkbox -->
								<td class="og-td-checkbox">
									<input
										type="checkbox"
										class="task-list-item-checkbox og-task-checkbox"
										checked={isDone}
										onchange={() => taskStore.toggleTask(task)}
										aria-label="Toggle task status"
									/>
								</td>

								<!-- Title & Details -->
								<td class="og-td-title">
									<div class="og-task-title-group">
										<span
											class="og-title-text {isDone ? 'is-struck' : ''}"
											role="button"
											tabindex="0"
											onclick={() => taskStore.openEditModal(task)}
											onkeydown={(e) => {
												if (e.key === 'Enter') taskStore.openEditModal(task);
											}}
										>
											{task.title}
										</span>

										{#if task.notes}
											<button
												class="og-notes-toggle {isExpanded ? 'is-expanded' : ''}"
												title="Toggle description"
												onclick={() => toggleExpand(task.id)}
											>
												<span class="og-btn-icon">{@html ICONS.notes}</span>
												<span>{isExpanded ? 'Hide' : 'Details'}</span>
											</button>
										{/if}
									</div>

									{#if isExpanded && task.notes}
										<div class="og-task-expanded-notes">
											{task.notes}
										</div>
									{/if}
								</td>

								<!-- Due Date -->
								<td class="og-td-due">
									{#if dueInfo}
										<span class="og-due-chip {dueInfo.isOverdue ? 'is-overdue' : dueInfo.isToday ? 'is-today' : ''}">
											<span class="og-chip-icon">{@html ICONS.calendar}</span>
											<span>{dueInfo.text}</span>
										</span>
									{:else}
										<span class="og-due-empty">—</span>
									{/if}
								</td>

								<!-- Actions -->
								<td class="og-td-actions">
									<button
										class="clickable-icon og-row-btn"
										aria-label="Edit task"
										onclick={() => taskStore.openEditModal(task)}
									>
										{@html ICONS.edit}
									</button>
									<button
										class="clickable-icon og-row-btn is-delete"
										aria-label="Delete task"
										onclick={() => taskStore.deleteTask(task.id)}
									>
										{@html ICONS.trash}
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.og-table-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		border: 1px solid var(--background-modifier-border);
		border-radius: 8px;
		background-color: var(--background-primary);
		color: var(--text-normal);
		font-family: var(--font-interface);
		overflow: hidden;
		margin: 12px 0;
	}

	.og-table-disconnected {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
		text-align: center;
		color: var(--text-muted);
	}

	.og-table-empty-icon {
		margin-bottom: 8px;
		opacity: 0.6;
	}

	.og-table-empty-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-normal);
		margin-bottom: 4px;
	}

	/* Toolbar */
	.og-table-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
		padding: 10px 14px;
		background-color: var(--background-secondary);
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.og-toolbar-left {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	:global(.og-list-badge) {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-normal);
		cursor: pointer;
	}

	:global(.og-list-badge:hover) {
		background-color: var(--background-modifier-hover);
	}

	.og-badge-chevron {
		display: flex;
		align-items: center;
		opacity: 0.6;
	}

	.og-toolbar-icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px 6px;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
	}

	.og-toolbar-icon-btn:hover {
		color: var(--text-normal);
		background-color: var(--background-modifier-hover);
	}

	/* Filter Tabs */
	.og-filter-tabs {
		display: flex;
		align-items: center;
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
		padding: 2px;
		gap: 2px;
	}

	.og-tab-btn {
		border: none;
		background: transparent;
		box-shadow: none;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-muted);
		padding: 4px 10px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.og-tab-btn:hover {
		color: var(--text-normal);
		background-color: var(--background-modifier-hover);
	}

	.og-tab-btn.is-active {
		color: var(--interactive-accent);
		background-color: var(--background-secondary);
		font-weight: 600;
	}

	/* Toolbar Right */
	.og-toolbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.og-search-box {
		display: flex;
		align-items: center;
		gap: 6px;
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
		padding: 2px 8px;
	}

	.og-search-icon {
		display: flex;
		align-items: center;
		color: var(--text-muted);
	}

	.og-search-input {
		border: none !important;
		background: transparent !important;
		box-shadow: none !important;
		font-size: 12px;
		color: var(--text-normal);
		padding: 3px 0;
		width: 130px;
		outline: none;
	}

	.og-table-add-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		font-weight: 500;
		padding: 4px 10px;
		border-radius: 6px;
		cursor: pointer;
	}

	.og-btn-icon {
		display: flex;
		align-items: center;
	}

	/* Table */
	.og-table-wrapper {
		width: 100%;
		overflow-x: auto;
	}

	.og-table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		font-size: 13px;
		text-align: left;
		margin: 0 !important;
		border: none !important;
	}

	.og-table thead {
		display: table;
		width: 100%;
		table-layout: fixed;
		border-bottom: 1px solid var(--background-modifier-border);
		background-color: var(--background-secondary-alt, var(--background-secondary));
		scrollbar-gutter: stable;
	}

	.og-table tbody {
		display: block;
		max-height: 355px;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-gutter: stable;
	}

	.og-table tbody tr {
		display: table;
		width: 100%;
		table-layout: fixed;
	}

	.og-table th,
	.og-table td {
		border: none !important;
	}

	.og-table th {
		padding: 8px 12px;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.og-th-status {
		width: 65px;
		text-align: center;
		vertical-align: middle;
		padding: 8px 0;
	}

	.og-th-title {
		width: auto;
		min-width: 220px;
		padding: 8px 12px;
	}

	.og-th-due {
		width: 140px;
		padding: 8px 12px;
	}

	.og-th-actions {
		width: 80px;
		text-align: right;
		padding: 8px 12px;
	}

	.og-table-row {
		border-bottom: 1px solid var(--background-modifier-border);
		transition: background-color 0.15s ease;
	}

	.og-table-row:last-child {
		border-bottom: none;
	}

	.og-table-row:hover {
		background-color: var(--background-modifier-hover);
	}

	.og-td-checkbox {
		width: 65px;
		text-align: center;
		vertical-align: middle;
		padding: 10px 0;
	}

	.og-task-checkbox {
		cursor: pointer;
		width: 24px;
		height: 24px;
		min-width: 18px;
		min-height: 18px;
		margin: 0 auto;
		display: inline-block;
		vertical-align: middle;
		accent-color: var(--interactive-accent);
	}

	.og-td-title {
		width: auto;
		min-width: 220px;
		padding: 10px 12px;
		vertical-align: top;
	}

	.og-td-due {
		width: 140px;
		padding: 10px 12px;
		vertical-align: top;
		white-space: nowrap;
	}

	.og-td-actions {
		width: 80px;
		padding: 10px 12px;
		text-align: right;
		vertical-align: top;
		white-space: nowrap;
	}

	.og-task-title-group {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.og-title-text {
		font-weight: 500;
		color: var(--text-normal);
		cursor: pointer;
		outline: none;
	}

	.og-title-text:hover {
		color: var(--text-accent);
	}

	.og-title-text.is-struck {
		text-decoration: line-through;
		color: var(--text-muted);
	}

	.og-notes-toggle {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		border: none;
		background-color: var(--background-secondary);
		border-radius: 4px;
		padding: 2px 6px;
		font-size: 11px;
		color: var(--text-muted);
		cursor: pointer;
	}

	.og-notes-toggle:hover,
	.og-notes-toggle.is-expanded {
		color: var(--text-normal);
		background-color: var(--background-modifier-border);
	}

	.og-task-expanded-notes {
		margin-top: 6px;
		padding: 8px 10px;
		background-color: var(--background-secondary);
		border-radius: 6px;
		font-size: 12px;
		color: var(--text-muted);
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.og-td-due {
		padding: 10px 12px;
		vertical-align: top;
		white-space: nowrap;
	}

	.og-due-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		padding: 2px 7px;
		border-radius: 4px;
		background-color: var(--background-secondary);
		color: var(--text-muted);
	}

	.og-due-chip.is-overdue {
		background-color: rgba(239, 68, 68, 0.15);
		color: var(--text-error, #f87171);
		font-weight: 600;
	}

	.og-due-chip.is-today {
		background-color: rgba(59, 130, 246, 0.15);
		color: var(--interactive-accent);
		font-weight: 600;
	}

	.og-chip-icon {
		display: flex;
		align-items: center;
	}

	.og-due-empty {
		color: var(--text-faint);
		padding-left: 6px;
	}

	.og-row-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 3px 6px;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
	}

	.og-row-btn:hover {
		color: var(--text-normal);
		background-color: var(--background-modifier-border);
	}

	.og-row-btn.is-delete:hover {
		color: var(--text-error, #f87171);
	}

	.og-table-cell-empty {
		grid-column: 1 / -1;
		width: 100%;
		padding: 30px;
		text-align: center;
		color: var(--text-muted);
		font-style: italic;
	}

	/* Dropdown styles reused */
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
</style>

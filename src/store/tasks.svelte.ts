import { Notice } from 'obsidian';
import {
	GoogleTask,
	GoogleTaskList,
	getTaskLists,
	getActiveTasks,
	getCompletedTasks,
	createTask,
	createTaskList,
	patchTaskList,
	deleteTaskList,
	patchTask,
	deleteTask,
} from '../api/tasks.api';
import { GoogleTasksClient } from '../api/client';
import type OgTaskPlugin from '../main';

export type TaskSortOption = 'myOrder' | 'date' | 'title';

class TaskStore {
	private client: GoogleTasksClient | null = null;
	private plugin: OgTaskPlugin | null = null;

	taskLists = $state<GoogleTaskList[]>([]);
	activeListId = $state<string | null>(null);
	activeTasks = $state<GoogleTask[]>([]);
	completedTasks = $state<GoogleTask[]>([]);
	showCompleted = $state<boolean>(false);
	isLoading = $state<boolean>(false);
	isLoadingCompleted = $state<boolean>(false);
	error = $state<string | null>(null);

	sortBy = $state<TaskSortOption>('myOrder');

	isModalOpen = $state<boolean>(false);
	editingTask = $state<GoogleTask | null>(null);

	isNewListModalOpen = $state<boolean>(false);
	isRenameModalOpen = $state<boolean>(false);

	openCreateModal(): void {
		this.editingTask = null;
		this.isModalOpen = true;
	}

	openEditModal(task: GoogleTask): void {
		this.editingTask = task;
		this.isModalOpen = true;
	}

	closeModal(): void {
		this.isModalOpen = false;
		this.editingTask = null;
	}

	openNewListModal(): void {
		this.isNewListModalOpen = true;
	}

	closeNewListModal(): void {
		this.isNewListModalOpen = false;
	}

	openRenameModal(): void {
		this.isRenameModalOpen = true;
	}

	closeRenameModal(): void {
		this.isRenameModalOpen = false;
	}

	setSortBy(sort: TaskSortOption): void {
		this.sortBy = sort;
	}

	get sortedActiveTasks(): GoogleTask[] {
		if (this.sortBy === 'date') {
			return [...this.activeTasks].sort((a, b) => {
				if (!a.due && !b.due) return 0;
				if (!a.due) return 1;
				if (!b.due) return -1;
				return new Date(a.due).getTime() - new Date(b.due).getTime();
			});
		}
		if (this.sortBy === 'title') {
			return [...this.activeTasks].sort((a, b) => a.title.localeCompare(b.title));
		}
		return this.activeTasks;
	}

	get isDefaultList(): boolean {
		if (this.taskLists.length <= 1) return true;
		return this.activeListId === this.taskLists[0]?.id;
	}

	get activeListTitle(): string {
		return this.taskLists.find((l) => l.id === this.activeListId)?.title ?? 'My Tasks';
	}

	init(plugin: OgTaskPlugin): void {
		this.plugin = plugin;
		this.client = new GoogleTasksClient(plugin);
	}

	get isConnected(): boolean {
		return Boolean(this.plugin?.settings.refreshToken);
	}

	async loadTaskLists(): Promise<void> {
		if (!this.client || !this.isConnected) {
			return;
		}

		this.isLoading = true;
		this.error = null;

		try {
			const lists = await getTaskLists(this.client);
			this.taskLists = lists;

			if (!this.activeListId || !lists.some((l) => l.id === this.activeListId)) {
				this.activeListId = lists[0]?.id ?? null;
			}

			if (this.activeListId) {
				await this.loadActiveTasks();
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to load Google Tasks: ${this.error}`);
		} finally {
			this.isLoading = false;
		}
	}

	async createTaskList(title: string): Promise<void> {
		if (!this.client || !this.isConnected) return;

		try {
			const newList = await createTaskList(this.client, title);
			this.taskLists = [...this.taskLists, newList];
			this.activeListId = newList.id;
			this.activeTasks = [];
			this.completedTasks = [];
			new Notice(`Created list "${newList.title}"`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to create list: ${msg}`);
		}
	}

	async renameActiveList(newTitle: string): Promise<void> {
		if (!this.client || !this.activeListId || !this.isConnected) return;

		const listId = this.activeListId;
		const trimmed = newTitle.trim();
		if (!trimmed) return;

		try {
			const updated = await patchTaskList(this.client, listId, trimmed);
			this.taskLists = this.taskLists.map((l) => (l.id === listId ? { ...l, title: updated.title } : l));
			new Notice(`Renamed list to "${updated.title}"`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to rename list: ${msg}`);
		}
	}

	async deleteActiveList(): Promise<void> {
		if (!this.client || !this.activeListId || !this.isConnected) return;

		if (this.isDefaultList) {
			new Notice('Default list cannot be deleted.');
			return;
		}

		const listId = this.activeListId;
		const listToDelete = this.taskLists.find((l) => l.id === listId);
		const listTitle = listToDelete?.title ?? 'List';

		try {
			await deleteTaskList(this.client, listId);
			this.taskLists = this.taskLists.filter((l) => l.id !== listId);
			this.activeListId = this.taskLists[0]?.id ?? null;
			this.activeTasks = [];
			this.completedTasks = [];

			new Notice(`Deleted list "${listTitle}"`);

			if (this.activeListId) {
				await this.loadActiveTasks();
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to delete list: ${msg}`);
		}
	}

	async switchList(listId: string): Promise<void> {
		if (this.activeListId === listId) return;
		this.activeListId = listId;
		this.activeTasks = [];
		this.completedTasks = [];

		await this.loadActiveTasks();
		if (this.showCompleted) {
			await this.loadCompletedTasks();
		}
	}

	async loadActiveTasks(): Promise<void> {
		if (!this.client || !this.activeListId || !this.isConnected) return;

		this.isLoading = true;
		this.error = null;

		try {
			const tasks = await getActiveTasks(this.client, this.activeListId);
			this.activeTasks = tasks;
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to load tasks: ${this.error}`);
		} finally {
			this.isLoading = false;
		}
	}

	async toggleShowCompleted(): Promise<void> {
		this.showCompleted = !this.showCompleted;
		if (this.showCompleted && this.completedTasks.length === 0) {
			await this.loadCompletedTasks();
		}
	}

	async loadCompletedTasks(): Promise<void> {
		if (!this.client || !this.activeListId || !this.isConnected) return;

		this.isLoadingCompleted = true;
		try {
			const tasks = await getCompletedTasks(this.client, this.activeListId, 5);
			this.completedTasks = tasks;
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to load completed tasks: ${msg}`);
		} finally {
			this.isLoadingCompleted = false;
		}
	}

	async toggleTask(task: GoogleTask): Promise<void> {
		if (!this.client || !this.activeListId) return;

		const listId = this.activeListId;
		const isCurrentlyCompleted = task.status === 'completed';
		const nextStatus = isCurrentlyCompleted ? 'needsAction' : 'completed';

		// 1. Optimistic UI update
		if (isCurrentlyCompleted) {
			this.completedTasks = this.completedTasks.filter((t) => t.id !== task.id);
			task.status = 'needsAction';
			this.activeTasks = [task, ...this.activeTasks];
		} else {
			this.activeTasks = this.activeTasks.filter((t) => t.id !== task.id);
			task.status = 'completed';
			this.completedTasks = [task, ...this.completedTasks.slice(0, 4)];
		}

		// 2. Sync to Google Tasks in background
		try {
			await patchTask(this.client, listId, task.id, { status: nextStatus });
		} catch (err) {
			// Rollback on failure
			if (isCurrentlyCompleted) {
				this.activeTasks = this.activeTasks.filter((t) => t.id !== task.id);
				task.status = 'completed';
				this.completedTasks = [task, ...this.completedTasks];
			} else {
				this.completedTasks = this.completedTasks.filter((t) => t.id !== task.id);
				task.status = 'needsAction';
				this.activeTasks = [task, ...this.activeTasks];
			}
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to update task: ${msg}`);
		}
	}

	async createTask(data: { title: string; notes?: string; due?: string }): Promise<void> {
		if (!this.client || !this.activeListId) {
			throw new Error('No active task list selected');
		}

		const newTask = await createTask(this.client, this.activeListId, data);
		this.activeTasks = [newTask, ...this.activeTasks];
		new Notice('Task created!');
	}

	async updateTask(taskId: string, patch: Partial<GoogleTask>): Promise<void> {
		if (!this.client || !this.activeListId) return;

		const listId = this.activeListId;
		const originalActive = this.activeTasks.find((t) => t.id === taskId);
		const originalCompleted = this.completedTasks.find((t) => t.id === taskId);
		const backup = originalActive ? { ...originalActive } : originalCompleted ? { ...originalCompleted } : null;

		// Optimistic update
		this.activeTasks = this.activeTasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
		this.completedTasks = this.completedTasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t));

		try {
			const updated = await patchTask(this.client, listId, taskId, patch);
			this.activeTasks = this.activeTasks.map((t) => (t.id === taskId ? { ...t, ...updated } : t));
			this.completedTasks = this.completedTasks.map((t) => (t.id === taskId ? { ...t, ...updated } : t));
			new Notice('Task updated!');
		} catch (err) {
			if (backup) {
				this.activeTasks = this.activeTasks.map((t) => (t.id === taskId ? backup : t));
				this.completedTasks = this.completedTasks.map((t) => (t.id === taskId ? backup : t));
			}
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to update task: ${msg}`);
		}
	}

	async deleteTask(taskId: string): Promise<void> {
		if (!this.client || !this.activeListId) return;

		const listId = this.activeListId;
		const activeBackup = [...this.activeTasks];
		const completedBackup = [...this.completedTasks];

		// Optimistic remove
		this.activeTasks = this.activeTasks.filter((t) => t.id !== taskId);
		this.completedTasks = this.completedTasks.filter((t) => t.id !== taskId);

		try {
			await deleteTask(this.client, listId, taskId);
			new Notice('Task deleted');
		} catch (err) {
			this.activeTasks = activeBackup;
			this.completedTasks = completedBackup;
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(`Failed to delete task: ${msg}`);
		}
	}
}

export const taskStore = new TaskStore();

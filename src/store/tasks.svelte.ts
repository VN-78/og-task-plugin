import { Notice } from 'obsidian';
import {
	GoogleTask,
	GoogleTaskList,
	getTaskLists,
	getActiveTasks,
	getCompletedTasks,
	createTask,
	patchTask,
	deleteTask,
} from '../api/tasks.api';
import { GoogleTasksClient } from '../api/client';
import type OgTaskPlugin from '../main';

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

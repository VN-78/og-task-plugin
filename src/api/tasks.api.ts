import type { GoogleTasksClient } from './client';

export interface GoogleTaskList {
	id: string;
	title: string;
	updated?: string;
}

export interface GoogleTask {
	id: string;
	title: string;
	notes?: string;
	status: 'needsAction' | 'completed';
	due?: string;
	completed?: string;
	updated?: string;
	starred?: boolean;
}

export async function getTaskLists(client: GoogleTasksClient): Promise<GoogleTaskList[]> {
	const res = await client.request<{ items?: GoogleTaskList[] }>(
		'/users/@me/lists?fields=items(id,title,updated)'
	);
	return res?.items ?? [];
}

export async function getActiveTasks(
	client: GoogleTasksClient,
	listId: string
): Promise<GoogleTask[]> {
	const fields = 'items(id,title,status,due,notes,updated)';
	const res = await client.request<{ items?: GoogleTask[] }>(
		`/lists/${encodeURIComponent(listId)}/tasks?showCompleted=false&showHidden=false&fields=${encodeURIComponent(fields)}`
	);
	return (res?.items ?? []).filter((task) => task.status === 'needsAction');
}

export async function getCompletedTasks(
	client: GoogleTasksClient,
	listId: string,
	maxResults = 5
): Promise<GoogleTask[]> {
	const fields = 'items(id,title,status,due,notes,completed,updated)';
	const res = await client.request<{ items?: GoogleTask[] }>(
		`/lists/${encodeURIComponent(listId)}/tasks?showCompleted=true&showHidden=true&maxResults=${maxResults}&fields=${encodeURIComponent(fields)}`
	);
	return (res?.items ?? []).filter((task) => task.status === 'completed');
}

export async function createTask(
	client: GoogleTasksClient,
	listId: string,
	task: { title: string; notes?: string; due?: string }
): Promise<GoogleTask> {
	const fields = 'id,title,status,due,notes,updated';
	return client.request<GoogleTask>(
		`/lists/${encodeURIComponent(listId)}/tasks?fields=${encodeURIComponent(fields)}`,
		{
			method: 'POST',
			body: JSON.stringify(task),
		}
	);
}

export async function patchTask(
	client: GoogleTasksClient,
	listId: string,
	taskId: string,
	patch: Partial<GoogleTask>
): Promise<GoogleTask> {
	const fields = 'id,title,status,due,notes,updated,completed';
	return client.request<GoogleTask>(
		`/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}?fields=${encodeURIComponent(fields)}`,
		{
			method: 'PATCH',
			body: JSON.stringify(patch),
		}
	);
}

export async function deleteTask(
	client: GoogleTasksClient,
	listId: string,
	taskId: string
): Promise<void> {
	await client.request<void>(
		`/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`,
		{
			method: 'DELETE',
		}
	);
}

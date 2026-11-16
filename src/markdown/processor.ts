import { MarkdownRenderChild, parseYaml } from 'obsidian';
import { mount, unmount } from 'svelte';
import TaskTable from '../ui/TaskTable.svelte';
import { taskStore } from '../store/tasks.svelte';

export interface TaskTableConfig {
	list?: string;
	filter?: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
	search?: string;
	title?: string;
}

export class TaskMarkdownChild extends MarkdownRenderChild {
	private component: ReturnType<typeof mount> | null = null;
	private source: string;

	constructor(containerEl: HTMLElement, source: string) {
		super(containerEl);
		this.source = source;
	}

	onload(): void {
		let config: TaskTableConfig = {};

		if (this.source.trim()) {
			try {
				const rawParsed: unknown = parseYaml(this.source);
				if (rawParsed && typeof rawParsed === 'object') {
					const record = rawParsed as Record<string, unknown>;
					const validFilters = ['all', 'today', 'upcoming', 'overdue', 'completed'] as const;
					type ValidFilter = (typeof validFilters)[number];

					let filterVal: ValidFilter | undefined = undefined;
					if (typeof record.filter === 'string') {
						const lower = record.filter.toLowerCase();
						if ((validFilters as readonly string[]).includes(lower)) {
							filterVal = lower as ValidFilter;
						}
					}

					config = {
						list: typeof record.list === 'string' ? record.list : undefined,
						filter: filterVal,
						search: typeof record.search === 'string' ? record.search : undefined,
						title: typeof record.title === 'string' ? record.title : undefined,
					};
				}
			} catch {
				// Fallback to empty config if YAML parsing fails
				config = {};
			}
		}

		this.containerEl.addClass('og-task-embed-host');
		if (this.containerEl.parentElement) {
			this.containerEl.parentElement.addClass('og-task-parent-clean');
		}

		this.component = mount(TaskTable, {
			target: this.containerEl,
			props: { config },
		});

		// Ensure task lists are loaded if needed
		if (taskStore.isConnected && taskStore.taskLists.length === 0) {
			void taskStore.loadTaskLists();
		}
	}

	onunload(): void {
		if (this.component) {
			void unmount(this.component);
			this.component = null;
		}
	}
}

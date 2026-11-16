export interface DueInfo {
	text: string;
	isOverdue: boolean;
	isToday: boolean;
	diffDays: number;
}

export function getDueInfo(dueStr?: string): DueInfo | null {
	if (!dueStr) return null;
	try {
		const d = new Date(dueStr);
		if (isNaN(d.getTime())) return null;

		const now = new Date();
		const dueMidnight = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
		const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		const diffMs = dueMidnight.getTime() - todayMidnight.getTime();
		const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays < 0) {
			const absDays = Math.abs(diffDays);
			return {
				text: absDays === 1 ? 'Yesterday' : `${absDays} days ago`,
				isOverdue: true,
				isToday: false,
				diffDays,
			};
		} else if (diffDays === 0) {
			return {
				text: 'Today',
				isOverdue: false,
				isToday: true,
				diffDays,
			};
		} else if (diffDays === 1) {
			return {
				text: 'Tomorrow',
				isOverdue: false,
				isToday: false,
				diffDays,
			};
		} else {
			const formatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
			return {
				text: formatted,
				isOverdue: false,
				isToday: false,
				diffDays,
			};
		}
	} catch {
		return null;
	}
}

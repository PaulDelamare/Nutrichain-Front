import type { RecallStatus } from '$lib/types/recall';

const labels: Record<RecallStatus, string> = {
	en_cours: 'En cours',
	cloture: 'Clôturé'
};

export function recallStatusLabel(statut: RecallStatus): string {
	return labels[statut];
}

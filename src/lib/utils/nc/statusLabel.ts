import type { NcStatus } from '$lib/types/nc';

const labels: Record<NcStatus, string> = {
	en_cours: 'En cours',
	quarantaine: 'Quarantaine'
};

export function ncStatusLabel(statut: NcStatus): string {
	return labels[statut];
}

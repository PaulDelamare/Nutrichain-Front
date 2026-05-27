import type { SyncState } from '$lib/types/integration';

const labels: Record<SyncState, string> = {
	ok: 'OK',
	latence: 'Latence'
};

export function syncLabel(statut: SyncState): string {
	return labels[statut];
}

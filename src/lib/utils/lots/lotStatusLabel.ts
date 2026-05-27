import type { LotStatus } from '$lib/types/lot';

const labels: Record<LotStatus, string> = {
	conforme: 'Conforme',
	surveillance: 'Surveillance',
	quarantaine: 'Quarantaine'
};

export function lotStatusLabel(statut: LotStatus): string {
	return labels[statut];
}

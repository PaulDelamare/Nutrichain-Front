import type { LotStatus } from '$lib/types/lot';

const labels: Record<LotStatus, string> = {
	conforme: 'Conforme',
	surveillance: 'Surveillance',
	quarantaine: 'Quarantaine',
	perime: 'Périmé',
	expedie: 'Expédié',
	inconnu: 'Inconnu'
};

export function lotStatusLabel(statut: LotStatus): string {
	return labels[statut];
}

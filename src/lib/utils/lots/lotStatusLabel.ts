import type { LotStatus } from '$lib/types/lot';

const labels: Record<LotStatus, string> = {
	conforme: 'Conforme',
	attente_qc: 'En attente de contrôle',
	surveillance: 'Sous rappel',
	quarantaine: 'Quarantaine',
	en_production: 'En production',
	epuise: 'Épuisé',
	rebut: 'Mis au rebut',
	perime: 'Périmé',
	expedie: 'Expédié',
	inconnu: 'Inconnu'
};

export function lotStatusLabel(statut: LotStatus): string {
	return labels[statut];
}

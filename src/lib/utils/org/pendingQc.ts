import type { ApiPendingQcBatch } from '$lib/Api/organization.server';
import type { PendingQcLot } from '$lib/types/quality';

function since(iso: string): string {
	const jours = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
	if (jours <= 0) return "aujourd'hui";
	if (jours === 1) return 'depuis 1 jour';
	return `depuis ${jours} jours`;
}

export function pendingQcToLots(batches: ApiPendingQcBatch[]): PendingQcLot[] {
	return batches.map((b) => ({
		id: b.id,
		// Le numéro de lot GS1 est ce que l'opérateur lit sur l'étiquette ; l'UUID ne lui parle pas.
		lot: b.lot_number ?? b.id.slice(0, 8).toUpperCase(),
		produit: b.produit?.nom ?? '—',
		quantite: `${b.quantite_actuelle} ${b.unite_code}`,
		depuis: since(b.date_creation)
	}));
}

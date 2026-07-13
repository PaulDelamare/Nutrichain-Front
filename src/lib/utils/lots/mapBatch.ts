import type { ApiBatch } from '$lib/Api/traceability.server';
import { movementsToLotEvents } from '$lib/utils/org/mappers';
import { resolveLotMapLocation } from '$lib/utils/lots/resolveLotMapLocation';
import type { LotSheet } from '$lib/types/lot-sheet';
import type { LotRow, LotStatus } from '$lib/types/lot';

// « Conforme » est une AFFIRMATION : elle ne doit jamais être le repli par défaut. Un lot
// PERIME tombait auparavant dans le `return 'conforme'` final et s'affichait en vert.
function mapStatut(statut: string): LotStatus {
	const s = statut.toUpperCase();
	// BLOQUE = lot bloqué (quarantaine qualité ou rappel) : c'est le statut réellement
	// filtré par l'API pour la quarantaine.
	if (s.includes('QUARANT') || s.includes('BLOQU')) return 'quarantaine';
	if (s.includes('SURVEILL') || s.includes('ALERT')) return 'surveillance';
	if (s.includes('PERIM')) return 'perime';
	if (s.includes('EXPEDIE')) return 'expedie';
	if (s === 'EN_STOCK' || s === 'PRET') return 'conforme';
	return 'inconnu';
}

function fmtDate(iso: string | null): string {
	if (!iso) return '—';
	return new Date(iso).toLocaleDateString('fr-FR');
}

export function batchToRow(batch: ApiBatch): LotRow {
	return {
		id: batch.id,
		// Numéro de lot GS1 lisible ; repli sur un id raccourci si absent (jamais l'UUID entier).
		lotNumber: batch.lot_number ?? batch.id.slice(0, 8),
		produit: batch.produit?.nom ?? '—',
		gtin: batch.produit?.code_gtin ?? '—',
		sscc: '—',
		// Emplacement réel du lot (matériel → lieu), renseigné à la réception.
		site: batch.materiel?.lieu?.nom ?? '—',
		statut: mapStatut(batch.statut),
		temperature: '—'
	};
}

function fmtTemp(value: string | number | null | undefined): string {
	if (value == null || value === '') return '—';
	return `${value} °C`;
}

export function batchToSheet(batch: ApiBatch): LotSheet {
	const events =
		batch.mouvements && batch.mouvements.length > 0
			? movementsToLotEvents(
					batch.mouvements.map((m) => ({
						...m,
						lot: { id: batch.id, produit: batch.produit }
					}))
				)
			: [];

	return {
		id: batch.id,
		produit: batch.produit?.nom ?? '—',
		gtin: batch.produit?.code_gtin ?? '—',
		dlc: fmtDate(batch.date_peremption),
		quantite: `${batch.quantite_actuelle} ${batch.unite?.nom ?? batch.unite_code}`,
		statut: mapStatut(batch.statut),
		statutRaw: batch.statut.replace(/_/g, ' '),
		temperature: fmtTemp(batch.materiel?.temp_actuelle),
		createdBy: batch.user?.name ?? '—',
		events,
		site: batch.materiel?.lieu?.nom ?? '—',
		zone: batch.materiel?.nom ?? '—',
		wmsSync: batch.date_creation ? `Créé le ${fmtDate(batch.date_creation)}` : '—',
		mapPin: resolveLotMapLocation(batch.materiel?.lieu?.nom, batch.materiel?.nom)
	};
}

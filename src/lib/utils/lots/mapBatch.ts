import type { ApiBatch } from '$lib/Api/traceability.server';
import { movementsToLotEvents } from '$lib/utils/org/mappers';
import type { LotSheet } from '$lib/types/lot-sheet';
import type { LotRow, LotStatus } from '$lib/types/lot';

function mapStatut(statut: string): LotStatus {
	const s = statut.toUpperCase();
	if (s.includes('QUARANT')) return 'quarantaine';
	if (s.includes('SURVEILL') || s.includes('ALERT')) return 'surveillance';
	return 'conforme';
}

function fmtDate(iso: string | null): string {
	if (!iso) return '—';
	return new Date(iso).toLocaleDateString('fr-FR');
}

export function batchToRow(batch: ApiBatch): LotRow {
	return {
		id: batch.id,
		produit: batch.produit?.nom ?? '—',
		gtin: batch.produit?.code_gtin ?? '—',
		sscc: '—',
		site: batch.unite?.nom ?? batch.unite_code ?? '—',
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
		wmsSync: batch.date_creation ? `Créé le ${fmtDate(batch.date_creation)}` : '—'
	};
}

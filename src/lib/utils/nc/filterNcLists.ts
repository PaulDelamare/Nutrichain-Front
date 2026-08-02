import type { NcRow, QuarantineLot } from '$lib/types/nc';
import type { PendingQcLot } from '$lib/types/quality';
import type { NcOpenFilters, PendingQcFilters, QuarantineFilters } from '$lib/types/ncFilters';
import { matchOption, matchText } from '$lib/utils/filters/matchText';

export function filterPendingQc(rows: PendingQcLot[], f: PendingQcFilters): PendingQcLot[] {
	return rows.filter(
		(r) =>
			matchText(r.lot, f.lot) &&
			matchOption(r.produit, f.produit) &&
			matchText(r.quantite, f.quantite) &&
			matchText(r.depuis, f.depuis)
	);
}

export function filterOpenNc(rows: NcRow[], f: NcOpenFilters): NcRow[] {
	return rows.filter(
		(r) =>
			matchText(r.id, f.id) &&
			matchOption(r.type, f.type) &&
			matchText(r.lot, f.lot) &&
			matchOption(r.statut, f.statut)
	);
}

export function filterQuarantine(rows: QuarantineLot[], f: QuarantineFilters): QuarantineLot[] {
	return rows.filter((r) => matchText(r.numero, f.numero) && matchText(r.detail, f.detail));
}

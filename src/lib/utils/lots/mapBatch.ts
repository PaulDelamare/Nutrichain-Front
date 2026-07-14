import type { ApiBatch, ApiBatchMouvement } from '$lib/Api/traceability.server';
import type { ApiAuditLog, ApiMovement } from '$lib/Api/organization.server';
import { movementsToLotEvents } from '$lib/utils/lots/lotEvents';
import { resolveLotMapLocation } from '$lib/utils/lots/resolveLotMapLocation';
import type { LotSheet } from '$lib/types/lot-sheet';
import type { LotRow, LotStatus } from '$lib/types/lot';

const AUDIT_TO_MOVEMENT: Record<string, string> = {
	CREATE_RECEIPT: 'RECEPTION',
	CREATE_RECEIPT_VIA_SYNC: 'RECEPTION',
	LIFT_BATCH_QUARANTINE: 'LEVEE_QUARANTAINE',
	BATCH_RECALL_TRIGGERED: 'RAPPEL',
	EXPEDITION: 'EXPEDITION',
	TRANSFORM_CONSUME: 'TRANSFORMATION_SORTIE',
	TRANSFORM_CREATE: 'TRANSFORMATION_ENTREE',
	TRANSFORMATION_ENTREE: 'TRANSFORMATION_ENTREE',
	TRANSFORMATION_SORTIE: 'TRANSFORMATION_SORTIE',
	TEMP_EXCURSION_DETECTED: 'QUARANTAINE_FROID'
};

export function auditLogsToBatchMouvements(logs: ApiAuditLog[]): ApiBatchMouvement[] {
	return logs.map((l) => ({
		id: l.id,
		type_action: AUDIT_TO_MOVEMENT[l.action] ?? l.action,
		quantite: '—',
		unite: '',
		created_at: l.horodatage,
		user: null,
		metadata: (l.nouvelle_valeur as Record<string, unknown> | null) ?? null
	}));
}

function mapStatut(statut: string): LotStatus {
	const s = statut.toUpperCase();
	if (s === 'EN_ATTENTE_QC') return 'attente_qc';
	if (s === 'BLOQUE' || s === 'QUARANTAINE') return 'quarantaine';
	if (s === 'ALERTE' || s === 'SURVEILLANCE') return 'surveillance';
	if (s === 'PERIME') return 'perime';
	if (s === 'EXPEDIE') return 'expedie';
	if (s === 'EN_STOCK' || s === 'PRET') return 'conforme';
	return 'inconnu';
}

function fmtDate(iso: string | null): string {
	if (!iso) return '—';
	return new Date(iso).toLocaleDateString('fr-FR');
}

export function batchToRow(
	batch: ApiBatch,
	equipmentTemps?: Map<string, string | number | null>
): LotRow {
	const temp =
		batch.materiel?.temp_actuelle ??
		(batch.id_materiel_actuel && equipmentTemps?.get(batch.id_materiel_actuel)) ??
		null;

	return {
		id: batch.id,
		lotNumber: batch.lot_number ?? batch.id.slice(0, 8),
		produit: batch.produit?.nom ?? '—',
		gtin: batch.produit?.code_gtin ?? '—',
		site: batch.materiel?.lieu?.nom ?? '—',
		statut: mapStatut(batch.statut),
		temperature: fmtTemp(temp)
	};
}

export function movementToBatchMouvement(m: ApiMovement): ApiBatchMouvement {
	return {
		id: m.id,
		type_action: m.type_action,
		quantite: m.quantite,
		unite: m.unite,
		created_at: m.created_at,
		user: m.user,
		metadata: null
	};
}

function fmtTemp(value: string | number | null | undefined): string {
	if (value == null || value === '') return '—';
	return `${value} °C`;
}

export function batchToSheet(batch: ApiBatch): LotSheet {
	const events = movementsToLotEvents(batch.mouvements ?? []);

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
		createdAtLabel: batch.date_creation ? `Créé le ${fmtDate(batch.date_creation)}` : '—',
		mapPin: resolveLotMapLocation(batch.materiel?.lieu?.nom, batch.materiel?.nom)
	};
}

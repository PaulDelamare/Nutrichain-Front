import type {
	ApiAlert,
	ApiAuditLog,
	ApiEquipment,
	ApiMember,
	ApiMovement,
	ApiQualityControl,
	ApiQuarantineBatch
} from '$lib/Api/organization.server';
import type { ApiBatch, ApiGenealogy } from '$lib/Api/traceability.server';
import type { Kpi, EpcisEvent, TaskItem } from '$lib/types/dashboard';
import type { ColdAlertLot, ColdAlertRow, ColdIncident } from '$lib/types/cold';
import type { NcRow, QuarantineLot } from '$lib/types/nc';
import type { Recall } from '$lib/types/recall';
import type { AppUser } from '$lib/types/user';
import type { TraceGraph } from '$lib/types/trace';
import type { Connector } from '$lib/types/integration';
import type { StoreStat, StoreBrief } from '$lib/types/portail';
import { openQualityIssues } from './quality';

const ROLE_LABELS: Record<string, string> = {
	owner: 'Propriétaire',
	admin: 'Administrateur',
	quality: 'Qualité',
	operator: 'Opérateur',
	viewer: 'Lecteur'
};

function fmtRelative(iso: string): string {
	const d = new Date(iso);
	const diff = Date.now() - d.getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 60) return `${mins} min`;
	const h = Math.floor(mins / 60);
	if (h < 48) return `${h} h`;
	return d.toLocaleDateString('fr-FR');
}

function fmtWhen(iso: string): string {
	const d = new Date(iso);
	const today = new Date();
	const isToday = d.toDateString() === today.toDateString();
	const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	if (isToday) return `Aujourd'hui — ${time}`;
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	if (d.toDateString() === yesterday.toDateString()) return `Hier — ${time}`;
	return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ` — ${time}`;
}

export function membersToUsers(members: ApiMember[]): AppUser[] {
	return members.map((m) => ({
		memberId: m.id,
		userId: m.user.id,
		email: m.user.email,
		role: ROLE_LABELS[m.role] ?? m.role,
		rawRole: m.role,
		lastLogin: '—',
		mfa: Boolean(m.user.twoFactorEnabled)
	}));
}

// Types d'alerte « chaîne du froid » : TEMP_EXCURSION est celui réellement émis par
// l'API (module IoT) ; FROID est conservé par compatibilité.
const COLD_ALERT_TYPES = ['TEMP_EXCURSION', 'FROID'];

// Idem pour les rappels : l'API émet PRODUCT_RECALL ; RAPPEL est conservé par compatibilité.
const RECALL_ALERT_TYPES = ['PRODUCT_RECALL', 'RAPPEL'];

export function alertsToCold(
	alerts: ApiAlert[],
	equipment: ApiEquipment[],
	quarantineBatches: ApiQuarantineBatch[] = []
): { incident: ColdIncident | null; rows: ColdAlertRow[] } {
	const cold = alerts.filter((a) => COLD_ALERT_TYPES.includes(a.type) && a.statut === 'ACTIVE');
	if (cold.length === 0) return { incident: null, rows: [] };

	const incident: ColdIncident = {
		id: shortRef(cold[0].id),
		message: cold[0].message
	};

	const rows: ColdAlertRow[] = cold.map((a) => {
		const equip = equipment.find((e) => e.id === a.id_materiel);
		const temp = equip?.temp_actuelle != null ? `${equip.temp_actuelle} °C` : '—';
		const statut = a.niveau_gravite === 'CRITIQUE' ? 'critique' : 'investigation';

		// L'alerte porte l'équipement en excursion ; les lots impactés sont ceux mis en quarantaine
		// SUR CET équipement. C'est ce qui relie l'alerte (l'effet visible) aux lots (le concret).
		const lotsImpactes: ColdAlertLot[] = a.id_materiel
			? quarantineBatches
					.filter((b) => b.id_materiel_actuel === a.id_materiel)
					.map((b) => ({ id: b.id, produit: b.produit?.nom ?? '—' }))
			: [];

		return {
			id: shortRef(a.id),
			site: equip?.lieu?.nom ?? '—',
			zone: equip?.nom ?? '—',
			tempActuelle: temp,
			depuis: fmtRelative(a.created_at),
			statut,
			lotsImpactes
		};
	});

	return { incident, rows };
}

// Référence courte et lisible d'une alerte. Les préfixes « RAP- » / « COLD- » d'avant étaient
// fabriqués : l'API ne délivre aucun numéro de rappel, seulement un identifiant technique.
function shortRef(id: string): string {
	return id.split('-')[0].slice(0, 8).toUpperCase();
}

export function countActiveColdAlerts(alerts: ApiAlert[]): number {
	return alerts.filter((a) => COLD_ALERT_TYPES.includes(a.type) && a.statut === 'ACTIVE').length;
}

// « NC ouvertes » : uniquement les contrôles qui demandent une action. Un contrôle conforme
// n'a rien à faire dans une liste de non-conformités.
export function qualityToNc(rows: ApiQualityControl[]): NcRow[] {
	return openQualityIssues(rows).map((q) => ({
		id: q.id.slice(0, 8).toUpperCase(),
		type: q.type_test,
		statut: q.resultat.toUpperCase().includes('QUARANT') ? 'quarantaine' : 'en_cours'
	}));
}

export function batchesToQuarantine(
	batches: { id: string; produit?: { nom: string }; statut: string }[]
): QuarantineLot[] {
	return batches.map((b) => ({
		lot: b.id,
		detail: `${b.produit?.nom ?? 'Lot'} — ${b.statut.toLowerCase().replace('_', ' ')}`
	}));
}

export function alertsToRappels(alerts: ApiAlert[]): Recall[] {
	return alerts
		.filter((a) => RECALL_ALERT_TYPES.includes(a.type))
		.map((a) => {
			// Message API : « RAPPEL DÉCLENCHÉ : <motif>. Source: <lot>. Total lots impactés: N.
			// Expéditions à notifier: M. » — on en extrait les chiffres réels.
			const lotsImpacted = a.message.match(/Total lots impactés: (\d+)/)?.[1];
			const shipments = a.message.match(/Expéditions à notifier: (\d+)/)?.[1];
			const motif = a.message
				.replace(/^Rappel produit — /, '')
				.replace(/^RAPPEL DÉCLENCHÉ : /, '')
				.split('. Source:')[0];

			return {
				id: shortRef(a.id),
				produit: motif || 'Produit',
				statut: a.statut === 'ACTIVE' ? ('en_cours' as const) : ('cloture' as const),
				lots: lotsImpacted ? `${lotsImpacted} lot(s) bloqué(s)` : (a.related_id ?? '—'),
				sites: shipments != null ? `${shipments} expédition(s) à notifier` : '—',
				etape: a.statut === 'ACTIVE' ? 'En cours' : 'Clôturé',
				etapeTitre: a.statut === 'ACTIVE' ? 'Blocage & notification' : 'Rappel terminé',
				etapeDetail: `Lot source : ${a.related_id ?? '—'}`
			};
		});
}

export function movementsToEvents(movements: ApiMovement[]): EpcisEvent[] {
	return movements.map((m) => {
		const titleMap: Record<string, string> = {
			RECEPTION: 'ObjectEvent — réception',
			EXPEDITION: 'TransactionEvent — expédition',
			QUARANTAINE: 'ObjectEvent — quarantaine',
			TRANSFORMATION: 'TransformationEvent — production'
		};
		return {
			when: fmtWhen(m.created_at),
			title: titleMap[m.type_action] ?? `ObjectEvent — ${m.type_action}`,
			meta: `Lot ${m.lot?.id ?? '—'} · ${m.lot?.produit?.nom ?? ''}`.trim()
		};
	});
}

export function buildDashboardKpis(
	batchCount: number,
	alerts: ApiAlert[],
	qualityCount: number,
	quarantineCount: number
): Kpi[] {
	const cold = alerts.filter(
		(a) => COLD_ALERT_TYPES.includes(a.type) && a.statut === 'ACTIVE'
	).length;
	const rappels = alerts.filter(
		(a) => RECALL_ALERT_TYPES.includes(a.type) && a.statut === 'ACTIVE'
	).length;
	return [
		{
			label: 'Lots suivis',
			value: String(batchCount),
			detail: 'Catalogue organisation active'
		},
		{
			label: 'Alertes chaîne du froid',
			value: String(cold),
			detail: cold > 0 ? 'Investigation en cours' : 'Aucune alerte active'
		},
		{
			label: 'Rappels en cours',
			value: String(rappels),
			detail: rappels > 0 ? 'Workflow actif' : 'Aucun rappel'
		},
		{
			label: 'Anomalies ouvertes',
			value: String(qualityCount),
			detail: `${quarantineCount} lot(s) en quarantaine`
		}
	];
}

export function buildDashboardTasks(alerts: ApiAlert[], qualityCount: number): TaskItem[] {
	const tasks: TaskItem[] = [];
	if (qualityCount > 0) {
		tasks.push({
			variant: 'info',
			text: `Validation qualité — ${qualityCount} contrôle(s) à traiter.`
		});
	}
	const rappel = alerts.find((a) => RECALL_ALERT_TYPES.includes(a.type) && a.statut === 'ACTIVE');
	if (rappel) {
		tasks.push({
			variant: 'warn',
			text: `Rappel actif — ${rappel.message.slice(0, 60)}…`,
			link: { href: '/rappels-produits', label: 'voir le suivi' }
		});
	}
	return tasks;
}

/** Généalogie structurée : amont (lots parents) → lot analysé → aval (lots issus). */
export function genealogyToGraph(
	genealogy: ApiGenealogy,
	selected: ApiBatch | undefined
): TraceGraph {
	return {
		upstream: genealogy.upstream.map((b) => ({
			phase: 'Lot parent',
			title: `${b.nom_produit} — ${b.lot_number ?? b.id}`,
			detail: `Statut ${b.statut}`,
			icon: 'amont' as const
		})),
		selected: {
			phase: 'Lot analysé',
			title: selected
				? `${selected.produit?.nom ?? 'Produit'} — ${selected.lot_number ?? selected.id}`
				: genealogy.batchId,
			badge: selected ? { label: selected.statut, variant: 'green' } : undefined,
			icon: 'transform'
		},
		downstream: genealogy.downstream.map((b) => ({
			phase: 'Lot issu',
			title: `${b.nom_produit} — ${b.lot_number ?? b.id}`,
			detail: `Statut ${b.statut}`,
			badge: { label: b.statut, variant: 'blue' },
			icon: 'aval' as const
		}))
	};
}

// Libellés lisibles des actions tracées (les codes bruts restent recherchables).
const AUDIT_ACTION_LABELS: Record<string, string> = {
	ADD: 'Ajout',
	CREATE: 'Création',
	OBSERVE: 'Observation',
	CREATE_EQUIPMENT: 'Matériel créé',
	CREATE_RECEIPT: 'Réception enregistrée',
	CREATE_RECEIPT_VIA_SYNC: 'Réception (mobile)',
	LIFT_BATCH_QUARANTINE: 'Levée de quarantaine',
	BATCH_RECALL_TRIGGERED: 'Rappel déclenché',
	ALERT_RESOLVED: 'Alerte résolue',
	EXPEDITION: 'Expédition',
	TEMP_EXCURSION_DETECTED: 'Excursion de température',
	TRANSFORM_CONSUME: 'Transformation — consommation',
	TRANSFORM_CREATE: 'Transformation — production',
	TRANSFORMATION_ENTREE: 'Transformation — entrée',
	TRANSFORMATION_SORTIE: 'Transformation — sortie'
};

// Détail lisible : le motif d'une décision (levée de quarantaine…) ou un changement de statut.
function auditDetail(l: ApiAuditLog): string {
	const nv = l.nouvelle_valeur;
	const ov = l.ancienne_valeur;
	if (nv && typeof nv.motif === 'string' && nv.motif.trim()) return nv.motif.trim();
	if (ov?.statut && nv?.statut && ov.statut !== nv.statut) return `${ov.statut} → ${nv.statut}`;
	return '';
}

export function auditLogsToRows(logs: ApiAuditLog[]) {
	return logs.map((l) => ({
		id: l.id,
		when: fmtWhen(l.horodatage),
		action: l.action,
		actionLabel: AUDIT_ACTION_LABELS[l.action] ?? l.action,
		detail: auditDetail(l),
		entity: l.entity,
		entityId: l.entity_id
	}));
}

export function buildPortailStats(
	customers: { id: string }[],
	shipments: { statut_livraison: string }[]
): StoreStat[] {
	const pending = shipments.filter((s) => s.statut_livraison !== 'LIVRE').length;
	return [
		{ label: 'Clients référencés', value: String(customers.length) },
		{
			label: 'Expéditions en cours',
			value: String(pending),
			accent: pending > 0 ? 'warn' : undefined
		}
	];
}

export function buildPortailBrief(alerts: ApiAlert[]): StoreBrief | null {
	const rappel = alerts.find((a) => RECALL_ALERT_TYPES.includes(a.type) && a.statut === 'ACTIVE');
	if (!rappel) return null;
	return {
		title: 'Consigne active',
		text: rappel.message
	};
}

export function auditToConnectors(logs: ApiAuditLog[]): Connector[] {
	const syncLogs = logs.filter((l) => l.entity === 'integration' || l.action === 'SYNC');
	if (syncLogs.length === 0) return [];
	return [
		{
			name: 'WMS / ERP (audit)',
			statut: 'ok',
			lines: syncLogs.slice(0, 2).map((l) => `${l.action} — ${fmtWhen(l.horodatage)}`)
		}
	];
}

import type {
	ApiAlert,
	ApiAuditLog,
	ApiEquipment,
	ApiMember,
	ApiMovement,
	ApiQualityControl
} from '$lib/Api/organization.server';
import type { ApiBatch, ApiGenealogy } from '$lib/Api/traceability.server';
import type { Kpi, EpcisEvent, TaskItem } from '$lib/data/dashboard';
import {
	kpis as mockKpis,
	recentEvents as mockEvents,
	tasks as mockTasks
} from '$lib/data/dashboard';
import type { ColdAlertRow, ColdIncident } from '$lib/types/cold';
import {
	coldAlerts as mockColdAlerts,
	coldIncident as mockColdIncident
} from '$lib/data/cold-alerts';
import type { NcRow, QuarantineLot } from '$lib/types/nc';
import { openNc as mockNc, quarantineLots as mockQuarantine } from '$lib/data/non-conformites';
import type { Recall } from '$lib/types/recall';
import { rappels as mockRappels } from '$lib/data/rappels';
import type { AppUser } from '$lib/types/user';
import { users as mockUsers } from '$lib/data/utilisateurs';
import type { TraceStep, TraceGraph } from '$lib/types/trace';
import { traceSteps as mockTraceSteps } from '$lib/data/trace-tree';
import type { LotEvent } from '$lib/types/lot-sheet';
import type { Connector } from '$lib/types/integration';
import { connectors as mockConnectors } from '$lib/data/integrations';
import type { StoreStat } from '$lib/data/portail-magasins';
import { storeStats as mockStoreStats, activeBrief as mockBrief } from '$lib/data/portail-magasins';

const ROLE_LABELS: Record<string, string> = {
	owner: 'Propriétaire',
	admin: 'Administrateur',
	manager: 'Manager',
	operator: 'Opérateur',
	member: 'Membre'
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
		email: m.user.email,
		role: ROLE_LABELS[m.role] ?? m.role,
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
	equipment: ApiEquipment[]
): { incident: ColdIncident | null; rows: ColdAlertRow[] } {
	const cold = alerts.filter((a) => COLD_ALERT_TYPES.includes(a.type) && a.statut === 'ACTIVE');
	if (cold.length === 0) return { incident: null, rows: [] };

	const incident: ColdIncident = {
		id: cold[0].id.slice(0, 12).toUpperCase(),
		message: cold[0].message
	};

	const rows: ColdAlertRow[] = cold.map((a) => {
		const equip = equipment.find((e) => e.id === a.id_materiel);
		const temp = equip?.temp_actuelle != null ? `${equip.temp_actuelle} °C` : '—';
		const statut =
			a.niveau_gravite === 'CRITIQUE'
				? 'critique'
				: a.niveau_gravite === 'MOYENNE'
					? 'investigation'
					: 'investigation';
		return {
			id: a.id.replace('seed-alert-', 'COLD-').slice(0, 12).toUpperCase(),
			site: equip?.lieu?.nom ?? 'Site',
			zone: equip?.nom ?? 'Zone',
			tempMax: temp,
			depuis: fmtRelative(a.created_at),
			statut
		};
	});

	return { incident, rows };
}

export function qualityToNc(rows: ApiQualityControl[]): NcRow[] {
	return rows.map((q) => ({
		id: q.id.slice(0, 8).toUpperCase(),
		type: q.type_test,
		statut: q.resultat.includes('QUARANT') ? 'quarantaine' : 'en_cours'
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
				id: a.id.replace('seed-alert-', 'RAP-').slice(0, 14).toUpperCase(),
				produit: motif || 'Produit',
				statut: a.statut === 'ACTIVE' ? ('en_cours' as const) : ('cloture' as const),
				lots: lotsImpacted ? `${lotsImpacted} lot(s) bloqué(s)` : (a.related_id ?? '—'),
				sites: shipments != null ? `${shipments} expédition(s) à notifier` : 'Magasins & RDC',
				progressLabel: 'Retrait rayon',
				progress: a.statut === 'ACTIVE' ? 78 : 100,
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

export function movementsToLotEvents(movements: ApiMovement[]): LotEvent[] {
	return movements.map((m) => ({
		time: new Date(m.created_at).toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit'
		}),
		day: new Date(m.created_at).toLocaleDateString('fr-FR'),
		title: m.type_action,
		detail: `${m.quantite} ${m.unite}${m.user?.name ? ` · ${m.user.name}` : ''}`
	}));
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
		},
		{ ...mockKpis[4] }
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
	return tasks.length > 0 ? tasks : mockTasks;
}

export function buildTraceSteps(
	suppliers: { nom_ferme: string; id: string }[],
	batches: ApiBatch[],
	lotId?: string | null
): TraceStep[] {
	if (suppliers.length === 0 && batches.length === 0) return mockTraceSteps;

	const supplier = suppliers[0];
	const batch = (lotId && batches.find((b) => b.id === lotId)) || batches[0];

	const steps: TraceStep[] = [];
	if (supplier) {
		steps.push({
			phase: 'Amont — matière',
			title: supplier.nom_ferme,
			detail: `Fournisseur ${supplier.id}`,
			icon: 'amont'
		});
	}
	steps.push({
		phase: 'Transformation',
		title: 'Conditionnement & contrôle',
		badge: { label: 'Traçabilité NutriChain', variant: 'green' },
		icon: 'transform'
	});
	if (batch) {
		steps.push({
			phase: 'Aval — produit fini',
			title: `${batch.id} — ${batch.produit?.nom ?? 'Produit'}`,
			badge: { label: batch.statut, variant: 'blue' },
			icon: 'aval'
		});
	}
	return steps;
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
			badge: { label: selected?.statut ?? 'EN_STOCK', variant: 'green' },
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

export function auditLogsToRows(logs: ApiAuditLog[]) {
	return logs.map((l) => ({
		id: l.id,
		when: fmtWhen(l.horodatage),
		action: l.action,
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

export function buildPortailBrief(alerts: ApiAlert[]) {
	const rappel = alerts.find((a) => RECALL_ALERT_TYPES.includes(a.type) && a.statut === 'ACTIVE');
	if (!rappel) return mockBrief;
	return {
		title: 'Consigne active',
		text: rappel.message
	};
}

export function auditToConnectors(logs: ApiAuditLog[]): Connector[] {
	const syncLogs = logs.filter((l) => l.entity === 'integration' || l.action === 'SYNC');
	if (syncLogs.length === 0) return mockConnectors;
	return [
		{
			name: 'WMS / ERP (audit)',
			statut: 'ok',
			lines: syncLogs.slice(0, 2).map((l) => `${l.action} — ${fmtWhen(l.horodatage)}`)
		},
		...mockConnectors.slice(1)
	];
}

export {
	mockKpis,
	mockEvents,
	mockTasks,
	mockColdAlerts,
	mockColdIncident,
	mockNc,
	mockQuarantine,
	mockRappels,
	mockUsers,
	mockTraceSteps,
	mockConnectors,
	mockStoreStats,
	mockBrief
};

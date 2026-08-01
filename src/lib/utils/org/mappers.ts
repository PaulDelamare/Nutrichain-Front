import type { ApiAlertBatch } from '$lib/Api/alerts.server';
import type {
	ApiAlert,
	ApiAuditLog,
	ApiEquipment,
	ApiMember,
	ApiMovement,
	ApiQualityControl
} from '$lib/Api/organization.server';
import type { ApiBatch, ApiGenealogy } from '$lib/Api/traceability.server';
import type { Kpi, EpcisEvent, TaskItem } from '$lib/types/dashboard';
import type { ColdAlertLot, ColdAlertRow, ColdIncident } from '$lib/types/cold';
import type { NcRow, QuarantineLot } from '$lib/types/nc';
import type { Recall } from '$lib/types/recall';
import type { AppUser } from '$lib/types/user';
import type { TraceGraph } from '$lib/types/trace';
import type { StoreStat, StoreBrief } from '$lib/types/portail';
import { movementEventLabel } from '$lib/utils/movements/labels';
import { numeroLot } from '$lib/utils/lots/lotLabel';
import { toColdAlertUiStatus } from '$lib/vocab/alertSeverity';
import { batchStatusLabel } from '$lib/vocab/batchStatus';
import { normalizeQualityResult, openQualityIssues } from './quality';

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
		mfa: Boolean(m.user.twoFactorEnabled)
	}));
}

const COLD_ALERT_TYPES = ['TEMP_EXCURSION', 'FROID'];

const RECALL_ALERT_TYPES = ['PRODUCT_RECALL', 'RAPPEL', 'RECALL_DEPTH_SATURATION'];

const MOTIF_BLOCAGE_LABEL: Record<string, string> = {
	CONTROLE_NON_CONFORME: 'contrôle non conforme'
};

export function listActiveColdAlerts(alerts: ApiAlert[]): ApiAlert[] {
	return alerts.filter((a) => COLD_ALERT_TYPES.includes(a.type) && a.statut === 'ACTIVE');
}

/**
 * Le capteur dont la courbe illustre l'incident affiché en bandeau.
 *
 * ⚠️ Ne PAS retomber d'emblée sur « le premier matériel muni d'un capteur » :
 * `GET /api/organization/equipment` ne promet aucun ordre, et l'ingestion de télémétrie réécrit la
 * ligne du matériel qu'elle mesure. Déclencher une excursion déplaçait donc le capteur concerné
 * hors de la première place, et la courbe basculait sur « aucune donnée » à l'instant précis où
 * elle avait quelque chose à montrer. Même stable, elle traçait une autre chambre que celle du
 * bandeau : une courbe plate sous un incident critique, ou l'inverse.
 *
 * On prend donc EXACTEMENT le matériel de l'incident — `cold[0]`, la même alerte que celle
 * qu'`alertsToCold` met en bandeau. Se rabattre sur l'alerte suivante quand celle-là n'a pas de
 * capteur exploitable (matériel nul, type `FROID` non issu d'une détection, capteur détaché)
 * reproduirait le défaut ailleurs : une courbe qui parle d'une autre chambre que le titre au-dessus
 * d'elle, sans que rien ne le signale. Pas de capteur pour l'incident ⇒ pas de courbe.
 */
export function pickTelemetrySensor(
	alerts: ApiAlert[],
	equipment: ApiEquipment[],
	requestedSensor: string | null
): string | null {
	if (requestedSensor) return requestedSensor;

	const incident = listActiveColdAlerts(alerts)[0];
	if (incident) {
		return equipment.find((e) => e.id === incident.id_materiel)?.sensor_id ?? null;
	}

	// Aucun incident : la page reste utile en surveillance. Tri explicite — l'API ne promet pas
	// d'ordre, et un `find` sur liste non triée ferait sauter la courbe d'une chambre à l'autre à
	// chaque mesure reçue.
	return (
		equipment
			.map((e) => e.sensor_id)
			.filter((s): s is string => Boolean(s))
			.sort()[0] ?? null
	);
}

/** Mappe les lots renvoyés par GET /api/alerts/:id/batches — jamais une reconstitution par frigo. */
export function mapAlertBatchesToLots(batches: ApiAlertBatch[]): ColdAlertLot[] {
	return batches.map((b) => ({
		id: b.id,
		produit: b.produit?.nom ?? '—',
		numeroLot: numeroLot(b),
		levable: b.levable,
		motifBlocage: b.motif_blocage ? (MOTIF_BLOCAGE_LABEL[b.motif_blocage] ?? b.motif_blocage) : null
	}));
}

/**
 * @param batchesByAlertId lots isolés par alerte (clé = UUID Alert), issus de
 *   GET /api/alerts/:id/batches — ne pas dériver de quarantine-batches × équipement.
 */
export function alertsToCold(
	alerts: ApiAlert[],
	equipment: ApiEquipment[],
	batchesByAlertId: ReadonlyMap<string, ApiAlertBatch[]> | Record<string, ApiAlertBatch[]> = {}
): { incident: ColdIncident | null; rows: ColdAlertRow[] } {
	const cold = listActiveColdAlerts(alerts);
	if (cold.length === 0) return { incident: null, rows: [] };

	const lookup =
		batchesByAlertId instanceof Map ? batchesByAlertId : new Map(Object.entries(batchesByAlertId));

	const incident: ColdIncident = {
		id: shortRef(cold[0].id),
		message: cold[0].message
	};

	const rows: ColdAlertRow[] = cold.map((a) => {
		const equip = equipment.find((e) => e.id === a.id_materiel);
		const temp = equip?.temp_actuelle != null ? `${equip.temp_actuelle} °C` : '—';
		const statut = toColdAlertUiStatus(a.niveau_gravite);

		return {
			id: shortRef(a.id),
			alertId: a.id,
			site: equip?.lieu?.nom ?? '—',
			zone: equip?.nom ?? '—',
			tempActuelle: temp,
			depuis: fmtRelative(a.created_at),
			statut,
			lotsImpactes: mapAlertBatchesToLots(lookup.get(a.id) ?? [])
		};
	});

	return { incident, rows };
}

function shortRef(id: string): string {
	return id.split('-')[0].slice(0, 8).toUpperCase();
}

export function countActiveColdAlerts(alerts: ApiAlert[]): number {
	return alerts.filter((a) => COLD_ALERT_TYPES.includes(a.type) && a.statut === 'ACTIVE').length;
}

export function qualityToNc(rows: ApiQualityControl[]): NcRow[] {
	return openQualityIssues(rows).map((q) => {
		const normalized = normalizeQualityResult(q.resultat);
		return {
			id: q.id.slice(0, 8).toUpperCase(),
			type: q.type_test,
			lot: q.lot?.produit?.nom ?? q.lot?.id?.slice(0, 8) ?? '—',
			statut: normalized === 'NON_CONFORME' ? 'quarantaine' : 'en_cours'
		};
	});
}

/**
 * Le panneau « Lots en quarantaine » affichait l'UUID en guise d'intitulé et « bloque » en guise de
 * statut (#81). L'identifiant reste nécessaire — lien vers la fiche, formulaire de levée — mais il
 * ne s'affiche plus : c'est `numero` que l'opérateur a sous les yeux sur l'étiquette.
 */
export function batchesToQuarantine(
	batches: { id: string; lot_number?: string | null; produit?: { nom: string }; statut: string }[]
): QuarantineLot[] {
	return batches.map((b) => ({
		id: b.id,
		numero: numeroLot(b),
		detail: `${b.produit?.nom ?? 'Lot'} — ${batchStatusLabel(b.statut)}`
	}));
}

export function alertsToRappels(alerts: ApiAlert[]): Recall[] {
	return alerts
		.filter((a) => RECALL_ALERT_TYPES.includes(a.type))
		.map((a) => {
			const isSaturation = a.type === 'RECALL_DEPTH_SATURATION';
			const lotsImpacted = a.message.match(/Total lots impactés: (\d+)/)?.[1];
			const shipments = a.message.match(/Expéditions à notifier: (\d+)/)?.[1];
			const motif = isSaturation
				? 'Saturation de profondeur — descendance peut être incomplète'
				: a.message
						.replace(/^Rappel produit — /, '')
						.replace(/^RAPPEL DÉCLENCHÉ : /, '')
						.split('. Source:')[0];

			return {
				id: shortRef(a.id),
				produit: motif || 'Produit',
				statut: a.statut === 'ACTIVE' ? ('en_cours' as const) : ('cloture' as const),
				lots: lotsImpacted ? `${lotsImpacted} lot(s) bloqué(s)` : (a.related_id ?? '—'),
				sites: shipments != null ? `${shipments} expédition(s) à notifier` : '—',
				etape: isSaturation
					? 'Vérification requise'
					: a.statut === 'ACTIVE'
						? 'En cours'
						: 'Clôturé',
				etapeTitre: isSaturation
					? 'Descendance incomplète'
					: a.statut === 'ACTIVE'
						? 'Blocage & notification'
						: 'Rappel terminé',
				etapeDetail: isSaturation ? a.message : `Lot source : ${a.related_id ?? '—'}`
			};
		});
}

/**
 * L'activité récente annonçait « Lot a26b8f1f-f569-44be-… » — un UUID sur le premier écran de la
 * démonstration (#81). L'API ne joint pas le numéro d'étiquette à ses mouvements
 * (`organization.service.ts` ne sélectionne que `{ id, produit }`) : on le retrouve dans le
 * catalogue que la page charge déjà pour son camembert, et à défaut on tronque.
 */
export function movementsToEvents(
	movements: ApiMovement[],
	catalogue: { id: string; lot_number?: string | null }[] = []
): EpcisEvent[] {
	// On indexe les numéros bruts et on ne calcule le repli qu'à la lecture : inutile de tronquer
	// 500 identifiants pour en afficher cinq.
	const numeroParLot = new Map(catalogue.map((b) => [b.id, b.lot_number]));

	return movements.map((m) => {
		const id = m.lot?.id;
		const numero = id ? (numeroParLot.get(id) ?? numeroLot({ id })) : '—';

		return {
			when: fmtWhen(m.created_at),
			title: movementEventLabel(m.type_action),
			meta: `Lot ${numero} · ${m.lot?.produit?.nom ?? ''}`.trim()
		};
	});
}

/**
 * `batchCount` doit être le total renvoyé par l'API, pas le nombre de lots de la page reçue :
 * le KPI annonçait « 100 » (puis « 100+ ») pour une organisation qui en suivait trois cents.
 */
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
			detail: 'Catalogue organisation active',
			href: '/recherche-lots',
			accent: 'green'
		},
		{
			label: 'Alertes chaîne du froid',
			value: String(cold),
			detail: cold > 0 ? 'Investigation en cours' : 'Aucune alerte active',
			href: '/chaine-du-froid',
			accent: 'red'
		},
		{
			label: 'Rappels en cours',
			value: String(rappels),
			detail: rappels > 0 ? 'Workflow actif' : 'Aucun rappel',
			href: '/rappels-produits',
			accent: 'blue'
		},
		{
			label: 'Anomalies ouvertes',
			value: String(qualityCount),
			detail: `${quarantineCount} lot(s) en quarantaine`,
			href: '/non-conformites',
			accent: 'orange'
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
			variant: rappel.type === 'RECALL_DEPTH_SATURATION' ? 'warn' : 'warn',
			text:
				rappel.type === 'RECALL_DEPTH_SATURATION'
					? `Rappel incomplet — ${rappel.message.slice(0, 80)}…`
					: `Rappel actif — ${rappel.message.slice(0, 60)}…`,
			link: { href: '/rappels-produits', label: 'voir le suivi' }
		});
	}
	return tasks;
}

/**
 * L'arbre parlait sa propre langue : « Statut EPUISE » et un badge « BLOQUE » là où la recherche de
 * lots affichait « Épuisé » et « Quarantaine » pour les mêmes lots, et l'UUID entier en guise de
 * numéro quand l'API n'en joignait pas (#81). Un écran de traçabilité qui ne nomme pas les choses
 * comme le reste de l'application donne l'impression de parler d'autres lots.
 */
export function genealogyToGraph(
	genealogy: ApiGenealogy,
	selected: ApiBatch | undefined
): TraceGraph {
	return {
		upstream: genealogy.upstream.map((b) => ({
			phase: 'Lot parent',
			title: `${b.nom_produit} — ${numeroLot(b)}`,
			detail: `Statut ${batchStatusLabel(b.statut)}`,
			icon: 'amont' as const
		})),
		selected: {
			phase: 'Lot analysé',
			title: selected
				? `${selected.produit?.nom ?? 'Produit'} — ${numeroLot(selected)}`
				: genealogy.batchId,
			badge: selected ? { label: batchStatusLabel(selected.statut), variant: 'green' } : undefined,
			icon: 'transform'
		},
		downstream: genealogy.downstream.map((b) => ({
			phase: 'Lot issu',
			title: `${b.nom_produit} — ${numeroLot(b)}`,
			detail: `Statut ${batchStatusLabel(b.statut)}`,
			badge: { label: batchStatusLabel(b.statut), variant: 'blue' },
			icon: 'aval' as const
		}))
	};
}

/**
 * Doit couvrir toutes les actions que l'API sait écrire : le journal d'audit affichait
 * « CREATE_SHIPMENT » et « MOVE_BATCH » entre deux lignes correctement traduites (#81). C'est la
 * piste WORM qu'on montre pour prouver l'inviolabilité de la traçabilité — elle doit se lire.
 *
 * Les marqueurs `IT_*` écrits par les tests d'intégration de l'API n'y figurent pas : ils ne
 * doivent jamais apparaître dans le journal d'une organisation réelle.
 */
const AUDIT_ACTION_LABELS: Record<string, string> = {
	ADD: 'Ajout',
	CREATE: 'Création',
	UPDATE: 'Modification',
	INIT: 'Initialisation',
	OBSERVE: 'Observation',

	CREATE_ORGANIZATION: 'Organisation créée',
	TRANSFER_OWNERSHIP: 'Transfert de propriété',
	CHANGE_MEMBER_ROLE: 'Rôle modifié',
	REVOKE_MEMBER: 'Accès révoqué',
	USER_ANONYMIZED: 'Utilisateur anonymisé',

	CREATE_EQUIPMENT: 'Matériel créé',
	CREATE_IOT_GATEWAY: 'Passerelle IoT créée',
	REVOKE_IOT_GATEWAY: 'Passerelle IoT révoquée',
	CREATE_LOCATION: 'Emplacement créé',
	UPDATE_LOCATION: 'Emplacement modifié',
	ARCHIVE_LOCATION: 'Emplacement archivé',
	REACTIVATE_LOCATION: 'Emplacement réactivé',

	CREATE_PRODUCT: 'Produit créé',
	UPDATE_PRODUCT: 'Produit modifié',
	ARCHIVE_PRODUCT: 'Produit archivé',
	IMPORT_CREATE_PRODUCT: 'Produit créé (import)',
	IMPORT_UPDATE_PRODUCT: 'Produit modifié (import)',

	CREATE_SUPPLIER: 'Fournisseur créé',
	UPDATE_SUPPLIER: 'Fournisseur modifié',
	ARCHIVE_SUPPLIER: 'Fournisseur archivé',
	REACTIVATE_SUPPLIER: 'Fournisseur réactivé',

	CREATE_CUSTOMER: 'Client créé',
	UPDATE_CUSTOMER: 'Client modifié',
	ARCHIVE_CUSTOMER: 'Client archivé',
	REACTIVATE_CUSTOMER: 'Client réactivé',
	IMPORT_CREATE_CUSTOMER: 'Client créé (import)',
	IMPORT_UPDATE_CUSTOMER: 'Client modifié (import)',

	RECEPTION: 'Réception',
	CREATE_RECEIPT: 'Réception enregistrée',
	CREATE_RECEIPT_VIA_SYNC: 'Réception (mobile)',
	CREATE_SHIPMENT: 'Expédition créée',
	CONFIRM_SHIPMENT_DELIVERY: 'Arrivée constatée',
	// L'API distingue le rejeu par un AUTRE acteur : c'est un désaccord sur la date d'arrivée, et
	// c'est la ligne qu'on cherchera en cas de litige. Le libellé doit le dire, pas le lisser.
	CONFIRM_SHIPMENT_DELIVERY_REJOUEE: 'Arrivée reconfirmée par un autre acteur',
	LIVRAISON: 'Arrivée chez le client',
	EXPEDITION: 'Expédition',
	DEPLACEMENT: 'Changement d’emplacement',
	MOVE_BATCH: 'Lot déplacé',
	SCRAP_BATCH: 'Lot mis au rebut',
	MISE_AU_REBUT: 'Mise au rebut',

	CONTROLE_QUALITE: 'Contrôle qualité',
	CREATE_QUALITY_CONTROL: 'Contrôle qualité enregistré',
	LIFT_BATCH_QUARANTINE: 'Levée de quarantaine',
	LEVEE_QUARANTAINE: 'Levée de quarantaine',
	QUARANTAINE_FROID: 'Quarantaine froid',
	BATCH_RECALL_TRIGGERED: 'Rappel déclenché',
	ALERT_RESOLVED: 'Alerte résolue',
	TEMP_EXCURSION_DETECTED: 'Excursion de température',

	TRANSFORM_CONSUME: 'Transformation — consommation',
	TRANSFORM_CREATE: 'Transformation — production',
	TRANSFORMATION_ENTREE: 'Transformation — entrée',
	TRANSFORMATION_SORTIE: 'Transformation — sortie'
};

function auditDetail(l: ApiAuditLog): string {
	const nv = l.nouvelle_valeur;
	const ov = l.ancienne_valeur;
	if (nv && typeof nv.motif === 'string' && nv.motif.trim()) return nv.motif.trim();
	// « EN_ATTENTE_QC → BLOQUE » se lisait tel quel dans le journal (#81).
	if (ov?.statut && nv?.statut && ov.statut !== nv.statut) {
		return `${batchStatusLabel(String(ov.statut))} → ${batchStatusLabel(String(nv.statut))}`;
	}
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

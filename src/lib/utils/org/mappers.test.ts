import { describe, it, expect } from 'vitest';
import {
	alertsToCold,
	alertsToRappels,
	auditLogsToRows,
	batchesToQuarantine,
	buildDashboardKpis,
	buildDashboardTasks,
	buildPortailBrief,
	buildPortailStats,
	countActiveColdAlerts,
	genealogyToGraph,
	membersToUsers,
	movementsToEvents,
	qualityToNc
} from './mappers';
import type {
	ApiAlert,
	ApiAuditLog,
	ApiMember,
	ApiMovement,
	ApiQualityControl
} from '$lib/Api/organization.server';
import type { ApiBatch, ApiGenealogy } from '$lib/Api/traceability.server';

function auditLog(partial: Partial<ApiAuditLog>): ApiAuditLog {
	return {
		id: 1,
		action: 'CREATE',
		entity: 'Batch',
		entity_id: 'lot-1',
		horodatage: '2026-07-11T10:00:00.000Z',
		...partial
	};
}

function alert(partial: Partial<ApiAlert>): ApiAlert {
	return {
		id: '11111111-2222-3333-4444-555555555555',
		type: 'TEMP_EXCURSION',
		niveau_gravite: 'CRITIQUE',
		message: 'Excursion de température',
		statut: 'ACTIVE',
		created_at: '2026-07-11T10:00:00.000Z',
		...partial
	};
}

describe('auditLogsToRows', () => {
	it('traduit une action connue en libellé lisible et conserve le code brut', () => {
		const [row] = auditLogsToRows([auditLog({ action: 'LIFT_BATCH_QUARANTINE' })]);
		expect(row.actionLabel).toBe('Levée de quarantaine');
		expect(row.action).toBe('LIFT_BATCH_QUARANTINE');
	});

	it('retombe sur le code brut pour une action inconnue', () => {
		const [row] = auditLogsToRows([auditLog({ action: 'ACTION_INEXISTANTE' })]);
		expect(row.actionLabel).toBe('ACTION_INEXISTANTE');
	});

	it('extrait le motif depuis nouvelle_valeur', () => {
		const [row] = auditLogsToRows([
			auditLog({
				action: 'LIFT_BATCH_QUARANTINE',
				nouvelle_valeur: { statut: 'EN_STOCK', motif: '2e contrôle conforme' }
			})
		]);
		expect(row.detail).toBe('2e contrôle conforme');
	});

	/**
	 * #81 — Le journal affichait « EN_ATTENTE_QC → BLOQUE ». C'est la piste WORM qu'on montre pour
	 * prouver l'inviolabilité de la traçabilité : elle doit se lire, pas se déchiffrer.
	 */
	it('nomme la transition de statut dans le vocabulaire de l’application (#81)', () => {
		const [row] = auditLogsToRows([
			auditLog({
				ancienne_valeur: { statut: 'EN_STOCK' },
				nouvelle_valeur: { statut: 'ALERTE' }
			})
		]);
		expect(row.detail).toBe('Conforme → Sous rappel');
	});

	it('laisse le détail vide sans motif ni changement de statut', () => {
		const [row] = auditLogsToRows([auditLog({})]);
		expect(row.detail).toBe('');
	});

	/**
	 * #81 — Le repli sur le code brut est une roue de secours, pas une traduction : `CREATE_SHIPMENT`,
	 * `CREATE_QUALITY_CONTROL` et `MOVE_BATCH` y tombaient et s'affichaient tels quels, entre deux
	 * lignes correctement traduites.
	 *
	 * La liste est celle des actions réellement écrites par l'API (les marqueurs `IT_*` des tests
	 * d'intégration en sont exclus) : ce test échoue le jour où l'API en ajoute une.
	 */
	it('traduit chaque action que l’API sait écrire (#81)', () => {
		const ACTIONS_API = [
			'ADD',
			'ALERT_RESOLVED',
			'ARCHIVE_CUSTOMER',
			'ARCHIVE_LOCATION',
			'ARCHIVE_PRODUCT',
			'ARCHIVE_SUPPLIER',
			'BATCH_RECALL_TRIGGERED',
			'CHANGE_MEMBER_ROLE',
			'CONTROLE_QUALITE',
			'CREATE',
			'CREATE_CUSTOMER',
			'CREATE_EQUIPMENT',
			'CREATE_IOT_GATEWAY',
			'CREATE_LOCATION',
			'CREATE_ORGANIZATION',
			'CREATE_PRODUCT',
			'CREATE_QUALITY_CONTROL',
			'CREATE_RECEIPT',
			'CREATE_RECEIPT_VIA_SYNC',
			'CREATE_SHIPMENT',
			'CREATE_SUPPLIER',
			'DEPLACEMENT',
			'EXPEDITION',
			'IMPORT_CREATE_CUSTOMER',
			'IMPORT_CREATE_PRODUCT',
			'IMPORT_UPDATE_CUSTOMER',
			'IMPORT_UPDATE_PRODUCT',
			'INIT',
			'LEVEE_QUARANTAINE',
			'LIFT_BATCH_QUARANTINE',
			'MISE_AU_REBUT',
			'MOVE_BATCH',
			'OBSERVE',
			'QUARANTAINE_FROID',
			'REACTIVATE_CUSTOMER',
			'REACTIVATE_LOCATION',
			'REACTIVATE_SUPPLIER',
			'RECEPTION',
			'REVOKE_IOT_GATEWAY',
			'REVOKE_MEMBER',
			'SCRAP_BATCH',
			'TEMP_EXCURSION_DETECTED',
			'TRANSFER_OWNERSHIP',
			'TRANSFORM_CONSUME',
			'TRANSFORM_CREATE',
			'UPDATE',
			'UPDATE_CUSTOMER',
			'UPDATE_LOCATION',
			'UPDATE_PRODUCT',
			'UPDATE_SUPPLIER',
			'USER_ANONYMIZED'
		];

		const brutes = auditLogsToRows(ACTIONS_API.map((action) => auditLog({ action })))
			.filter((row) => row.actionLabel === row.action)
			.map((row) => row.action);

		expect(brutes).toEqual([]);
	});
});

describe('alertsToCold', () => {
	it('ne rend ni incident ni ligne quand aucune alerte froid n’est active', () => {
		expect(alertsToCold([], [])).toEqual({ incident: null, rows: [] });
	});

	it('n’invente pas de site ni de zone quand le matériel est inconnu', () => {
		const { rows } = alertsToCold([alert({ id_materiel: 'inconnu' })], []);
		expect(rows[0].site).toBe('—');
		expect(rows[0].zone).toBe('—');
	});

	it('prend uniquement les lots renvoyés par /alerts/:id/batches pour cette alerte', () => {
		const alertId = '11111111-2222-3333-4444-555555555555';
		const { rows } = alertsToCold(
			[alert({ id: alertId, id_materiel: 'frigo-1' })],
			[{ id: 'frigo-1', nom: 'Frigo A', lieu: { nom: 'Quai' } } as never],
			{
				[alertId]: [
					{
						id: 'lot-a',
						lot_number: 'L1',
						quantite_actuelle: '10',
						unite_code: 'KG',
						produit: { nom: 'Beurre' },
						levable: true,
						motif_blocage: null
					}
				]
			}
		);

		expect(rows[0].lotsImpactes).toEqual([
			{ id: 'lot-a', produit: 'Beurre', levable: true, motifBlocage: null }
		]);
	});

	it('n’attribue pas à une alerte les lots d’une autre, même frigo', () => {
		const a1 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
		const a2 = 'ffffffff-1111-2222-3333-444444444444';
		const { rows } = alertsToCold(
			[
				alert({ id: a1, id_materiel: 'frigo-1' }),
				alert({ id: a2, id_materiel: 'frigo-1', message: 'autre' })
			],
			[{ id: 'frigo-1', nom: 'Frigo A', lieu: { nom: 'Quai' } } as never],
			{
				[a1]: [
					{
						id: 'lot-a',
						lot_number: 'L1',
						quantite_actuelle: '1',
						unite_code: 'U',
						produit: { nom: 'Beurre' },
						levable: true,
						motif_blocage: null
					}
				],
				[a2]: []
			}
		);

		expect(rows[0].lotsImpactes.map((l) => l.id)).toEqual(['lot-a']);
		expect(rows[1].lotsImpactes).toEqual([]);
	});

	it('propage levable=false et le motif de blocage', () => {
		const alertId = '11111111-2222-3333-4444-555555555555';
		const { rows } = alertsToCold([alert({ id: alertId })], [], {
			[alertId]: [
				{
					id: 'lot-x',
					lot_number: 'LX',
					quantite_actuelle: '1',
					unite_code: 'U',
					produit: { nom: 'Yaourt' },
					levable: false,
					motif_blocage: 'CONTROLE_NON_CONFORME'
				}
			]
		});

		expect(rows[0].lotsImpactes[0]).toMatchObject({
			levable: false,
			motifBlocage: 'contrôle non conforme'
		});
	});

	it('ne rattache aucun lot quand l’endpoint n’en renvoie pas', () => {
		const { rows } = alertsToCold([alert({ id_materiel: 'frigo-1' })], [], {});
		expect(rows[0].lotsImpactes).toEqual([]);
	});

	it('mappe PANIC en statut critique', () => {
		const { rows } = alertsToCold([alert({ niveau_gravite: 'PANIC' })], []);
		expect(rows[0].statut).toBe('critique');
	});

	it('conserve l’UUID API pour permettre la clôture', () => {
		const { rows } = alertsToCold([alert({ id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' })], []);
		expect(rows[0].alertId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
		expect(rows[0].id).not.toBe(rows[0].alertId);
	});
});

describe('alertsToRappels', () => {
	it('ne rend aucun rappel quand aucune alerte de rappel n’existe', () => {
		expect(alertsToRappels([])).toEqual([]);
	});

	it('n’invente pas de sites impactés quand l’API n’en fournit pas', () => {
		const [recall] = alertsToRappels([alert({ type: 'PRODUCT_RECALL', message: 'Salmonelle' })]);
		expect(recall.sites).toBe('—');
	});

	it('n’expose aucune progression : l’API ne suit pas les confirmations magasin', () => {
		const [recall] = alertsToRappels([alert({ type: 'PRODUCT_RECALL', message: 'Salmonelle' })]);
		expect(recall).not.toHaveProperty('progress');
		expect(recall).not.toHaveProperty('progressLabel');
	});

	it('reprend les chiffres réels annoncés par l’API', () => {
		const [recall] = alertsToRappels([
			alert({
				type: 'PRODUCT_RECALL',
				message:
					'RAPPEL DÉCLENCHÉ : Salmonelle. Source: lot-9. Total lots impactés: 4. Expéditions à notifier: 2.'
			})
		]);
		expect(recall.lots).toBe('4 lot(s) bloqué(s)');
		expect(recall.sites).toBe('2 expédition(s) à notifier');
	});
});

describe('buildDashboardKpis', () => {
	it('ne rend que des indicateurs calculés — aucun KPI d’intégration inventé', () => {
		const kpis = buildDashboardKpis(0, [], 0, 0);
		expect(kpis).toHaveLength(4);
		expect(kpis.map((k) => k.label)).not.toContain('Sync. intégrations');
		expect(JSON.stringify(kpis)).not.toContain('99 %');
	});
});

describe('buildDashboardTasks', () => {
	it('ne rend aucune tâche quand il n’y a rien à traiter', () => {
		expect(buildDashboardTasks([], 0)).toEqual([]);
	});
});

describe('movementsToEvents', () => {
	const mouvement = (partial: Partial<ApiMovement> = {}): ApiMovement =>
		({
			id: 'mvt-1',
			type_action: 'EXPEDITION',
			created_at: '2026-07-11T10:00:00.000Z',
			lot: {
				id: '2a71fc4a-76e6-423f-8b00-05941af0b8ca',
				produit: { nom: 'Plaquette de Beurre Doux 250g' }
			},
			...partial
		}) as ApiMovement;

	it('ne rend aucun événement quand il n’y a aucun mouvement', () => {
		expect(movementsToEvents([])).toEqual([]);
	});

	/**
	 * #81 — L'activité récente du tableau de bord — le premier écran de la démonstration — annonçait
	 * « Lot 2a71fc4a-76e6-423f-8b00-05941af0b8ca ». L'API ne joint pas le numéro à ses mouvements
	 * (`organization.service.ts` ne sélectionne que `{ id, produit }`) : on le retrouve dans le
	 * catalogue de lots que la page charge déjà pour son camembert.
	 */
	it('nomme le lot par son numéro d’étiquette (#81)', () => {
		const [event] = movementsToEvents(
			[mouvement()],
			[{ id: '2a71fc4a-76e6-423f-8b00-05941af0b8ca', lot_number: '260726-IXWL0H' }]
		);

		expect(event.meta).toBe('Lot 260726-IXWL0H · Plaquette de Beurre Doux 250g');
	});

	it('se replie sur un préfixe court quand le lot est hors du catalogue chargé', () => {
		// Le catalogue est plafonné : un mouvement peut porter sur un lot plus ancien. Mieux vaut
		// huit caractères que trente-six.
		const [event] = movementsToEvents([mouvement()], []);

		expect(event.meta).toBe('Lot 2a71fc4a · Plaquette de Beurre Doux 250g');
	});
});

describe('buildPortailBrief', () => {
	it('ne rend aucune consigne quand aucun rappel n’est actif', () => {
		expect(buildPortailBrief([])).toBeNull();
	});

	it('reprend le message réel du rappel actif', () => {
		const brief = buildPortailBrief([
			alert({ type: 'PRODUCT_RECALL', message: 'Retrait immédiat' })
		]);
		expect(brief?.text).toBe('Retrait immédiat');
	});
});

describe('countActiveColdAlerts', () => {
	it('ne compte QUE les alertes froid actives — c’est le chiffre du badge global', () => {
		const alerts = [
			alert({ type: 'TEMP_EXCURSION', statut: 'ACTIVE' }),
			alert({ type: 'TEMP_EXCURSION', statut: 'RESOLVED' }),
			alert({ type: 'PRODUCT_RECALL', statut: 'ACTIVE' })
		];
		expect(countActiveColdAlerts(alerts)).toBe(1);
	});

	it('vaut zéro sans aucune alerte', () => {
		expect(countActiveColdAlerts([])).toBe(0);
	});
});

describe('qualityToNc', () => {
	function control(resultat: string): ApiQualityControl {
		return {
			id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
			type_test: 'Analyse microbiologique',
			resultat,
			date_test: '2026-07-11T10:00:00.000Z',
			lot: { id: 'lot-1' }
		};
	}

	it('n’inscrit PAS un contrôle conforme dans la liste des non-conformités', () => {
		expect(qualityToNc([control('CONFORME')])).toEqual([]);
	});

	it('retient les contrôles qui demandent une action', () => {
		const rows = qualityToNc([
			control('NON_CONFORME — QUARANTAINE'),
			control('NON_CONFORME'),
			control('EN_COURS')
		]);
		expect(rows).toHaveLength(3);
		expect(rows[0].statut).toBe('quarantaine');
		expect(rows[1].statut).toBe('quarantaine');
		expect(rows[2].statut).toBe('en_cours');
	});
});

describe('genealogyToGraph', () => {
	it('n’invente pas le statut « EN_STOCK » quand le lot analysé est inconnu', () => {
		const genealogy: ApiGenealogy = { batchId: 'lot-1', upstream: [], downstream: [] };
		const graph = genealogyToGraph(genealogy, undefined);
		expect(graph.selected.badge).toBeUndefined();
	});

	it('identifie les lots parents et issus par leur numéro GS1', () => {
		const graph = genealogyToGraph(
			{
				batchId: 'lot-1',
				upstream: [{ id: 'p1', nom_produit: 'Lait cru', statut: 'EXPEDIE', lot_number: 'A-1' }],
				downstream: [{ id: 'd1', nom_produit: 'Yaourt', statut: 'EN_STOCK', lot_number: 'B-2' }]
			},
			{
				id: 'lot-1',
				statut: 'EN_STOCK',
				lot_number: 'C-3',
				produit: { nom: 'Lait pasteurisé' }
			} as ApiBatch
		);

		expect(graph.upstream[0].title).toBe('Lait cru — A-1');
		expect(graph.downstream[0].title).toBe('Yaourt — B-2');
		expect(graph.selected.title).toBe('Lait pasteurisé — C-3');
	});

	// #80/#81 — Le repli est un préfixe court, jamais l'UUID entier : il déborde de la carte et
	// n'apprend rien. C'est la règle de `numeroLot`, la même que dans les six autres écrans.
	it('retombe sur un préfixe court quand le lot n’a pas de numéro GS1', () => {
		const graph = genealogyToGraph(
			{
				batchId: '2a71fc4a-76e6-423f-8b00-05941af0b8ca',
				upstream: [
					{
						id: '9f3e1d20-1111-2222-3333-444455556666',
						nom_produit: 'Lait cru',
						statut: 'EXPEDIE'
					}
				],
				downstream: []
			},
			{ id: '2a71fc4a-76e6-423f-8b00-05941af0b8ca', statut: 'EN_STOCK' } as ApiBatch
		);

		expect(graph.upstream[0].title).toBe('Lait cru — 9f3e1d20');
		expect(graph.selected.title).toBe('Produit — 2a71fc4a');
	});

	/**
	 * #81 — L'arbre affichait « Statut EPUISE » et un badge « BLOQUE » là où la recherche de lots
	 * disait « Épuisé » et « Quarantaine » pour les mêmes lots. Deux écrans du parcours qualité, deux
	 * vocabulaires : le jury lit deux choses différentes sur un même lot.
	 */
	it('nomme les statuts dans le vocabulaire de l’application, pas en code API (#81)', () => {
		const graph = genealogyToGraph(
			{
				batchId: 'lot-1',
				upstream: [{ id: 'p1', nom_produit: 'Lait cru', statut: 'EPUISE', lot_number: 'A-1' }],
				downstream: [
					{ id: 'd1', nom_produit: 'Yaourt', statut: 'EN_ATTENTE_QC', lot_number: 'B-2' }
				]
			},
			{ id: 'lot-1', statut: 'BLOQUE', lot_number: 'C-3' } as ApiBatch
		);

		expect(graph.upstream[0].detail).toBe('Statut Épuisé');
		expect(graph.downstream[0].detail).toBe('Statut En attente de contrôle');
		expect(graph.downstream[0].badge).toEqual({
			label: 'En attente de contrôle',
			variant: 'blue'
		});
		expect(graph.selected.badge).toEqual({ label: 'Quarantaine', variant: 'green' });
	});
});

describe('membersToUsers', () => {
	function member(partial: Partial<ApiMember> = {}): ApiMember {
		return {
			id: 'membre-1',
			role: 'quality',
			user: { id: 'u1', email: 'a@b.fr', name: 'Alice', twoFactorEnabled: true },
			...partial
		};
	}

	// Révoquer un membre passe par l'id d'adhésion, pas par l'id utilisateur : les confondre
	// renvoie un 404 de l'API au moment où l'on retire un accès.
	it('conserve l’identifiant d’adhésion en plus de l’identifiant utilisateur', () => {
		const [user] = membersToUsers([member()]);
		expect(user).toMatchObject({ memberId: 'membre-1', userId: 'u1' });
	});

	it('traduit le rôle tout en gardant le code brut pour les comparaisons', () => {
		const [user] = membersToUsers([member({ role: 'owner' })]);
		expect(user.role).toBe('Propriétaire');
		expect(user.rawRole).toBe('owner');
	});

	it('affiche un rôle inconnu tel quel plutôt que rien', () => {
		const [user] = membersToUsers([member({ role: 'auditeur' })]);
		expect(user.role).toBe('auditeur');
	});

	it('considère la 2FA comme désactivée quand l’API ne se prononce pas', () => {
		const [user] = membersToUsers([
			member({ user: { id: 'u1', email: 'a@b.fr', name: 'Alice', twoFactorEnabled: null } })
		]);
		expect(user.mfa).toBe(false);
	});
});

describe('batchesToQuarantine', () => {
	/**
	 * #81 — Ce test entérinait « Beurre — en attente_qc » sous le nom de « statut lisible ». Le
	 * panneau « Lots en quarantaine » affichait donc `bloque` là où le reste de l'application dit
	 * « Quarantaine » — et l'ancien format n'échappait même que le PREMIER souligné.
	 */
	it('nomme le statut dans le vocabulaire de l’application', () => {
		const [lot] = batchesToQuarantine([
			{
				id: '2a71fc4a-76e6-423f-8b00-05941af0b8ca',
				lot_number: '260726-IXWL0H',
				produit: { nom: 'Beurre' },
				statut: 'EN_ATTENTE_QC'
			}
		]);
		expect(lot.detail).toBe('Beurre — En attente de contrôle');
	});

	it('ne laisse pas le produit vide quand l’API ne le joint pas', () => {
		const [lot] = batchesToQuarantine([
			{ id: '2a71fc4a-76e6-423f-8b00-05941af0b8ca', statut: 'BLOQUE' }
		]);
		expect(lot.detail).toBe('Lot — Quarantaine');
	});

	/**
	 * #81 — Le panneau affichait l'UUID comme intitulé du lien vers la fiche. L'identifiant reste
	 * nécessaire (lien et formulaire de levée), mais ce n'est pas ce qu'on montre : l'opérateur a le
	 * numéro d'étiquette en main.
	 */
	it('sépare l’identifiant technique du numéro que lit l’opérateur (#81)', () => {
		const [lot] = batchesToQuarantine([
			{
				id: '2a71fc4a-76e6-423f-8b00-05941af0b8ca',
				lot_number: '260726-IXWL0H',
				produit: { nom: 'Beurre' },
				statut: 'BLOQUE'
			}
		]);

		expect(lot.id).toBe('2a71fc4a-76e6-423f-8b00-05941af0b8ca');
		expect(lot.numero).toBe('260726-IXWL0H');
	});

	it('se replie sur un préfixe court quand le lot n’a pas de numéro', () => {
		const [lot] = batchesToQuarantine([
			{ id: '2a71fc4a-76e6-423f-8b00-05941af0b8ca', statut: 'BLOQUE' }
		]);
		expect(lot.numero).toBe('2a71fc4a');
	});
});

describe('alertsToRappels — saturation de profondeur', () => {
	// Un rappel dont la descendance est incomplète ne doit pas s'afficher comme un rappel normal :
	// c'est précisément le cas où il faut vérifier à la main.
	it('signale explicitement que la descendance peut être incomplète', () => {
		const [recall] = alertsToRappels([
			alert({
				type: 'RECALL_DEPTH_SATURATION',
				message: 'Profondeur maximale atteinte sur le lot lot-9.'
			})
		]);

		expect(recall.produit).toBe('Saturation de profondeur — descendance peut être incomplète');
		expect(recall.etape).toBe('Vérification requise');
		expect(recall.etapeTitre).toBe('Descendance incomplète');
		expect(recall.etapeDetail).toBe('Profondeur maximale atteinte sur le lot lot-9.');
	});

	it('marque un rappel résolu comme clôturé', () => {
		const [recall] = alertsToRappels([
			alert({ type: 'PRODUCT_RECALL', statut: 'RESOLVED', message: 'Rappel produit — Listeria' })
		]);

		expect(recall.statut).toBe('cloture');
		expect(recall.etape).toBe('Clôturé');
		expect(recall.etapeTitre).toBe('Rappel terminé');
	});

	it('rappelle le lot source à défaut de compte des lots bloqués', () => {
		const [recall] = alertsToRappels([
			alert({ type: 'RAPPEL', related_id: 'lot-9', message: 'Rappel produit — Listeria' })
		]);

		expect(recall.lots).toBe('lot-9');
		expect(recall.etapeDetail).toBe('Lot source : lot-9');
	});
});

describe('buildDashboardKpis — ce que le chiffre affirme', () => {
	/**
	 * ⚠️ Le KPI affichait la taille de la page reçue, plafonnée par l'API : une organisation qui
	 * suivait 342 lots lisait « 100 », puis « 100+ ». Il compte désormais le total réel, que
	 * l'appelant tient de la pagination.
	 */
	it('affiche le total du catalogue, pas la taille de la page reçue', () => {
		const [lots] = buildDashboardKpis(342, [], 0, 0);
		expect(lots.value).toBe('342');
		expect(lots.detail).toBe('Catalogue organisation active');
	});

	it('annonce un catalogue vide sans fioriture', () => {
		const [lots] = buildDashboardKpis(0, [], 0, 0);
		expect(lots.value).toBe('0');
	});

	it('compte séparément les alertes froid et les rappels actifs', () => {
		const kpis = buildDashboardKpis(
			10,
			[
				alert({ type: 'TEMP_EXCURSION', statut: 'ACTIVE' }),
				alert({ type: 'PRODUCT_RECALL', statut: 'ACTIVE' }),
				alert({ type: 'PRODUCT_RECALL', statut: 'RESOLVED' })
			],
			3,
			2
		);

		expect(kpis[1]).toMatchObject({ value: '1', detail: 'Investigation en cours' });
		expect(kpis[2]).toMatchObject({ value: '1', detail: 'Workflow actif' });
		expect(kpis[3]).toMatchObject({ value: '3', detail: '2 lot(s) en quarantaine' });
	});

	it('affiche « aucune » plutôt qu’un zéro sec quand tout va bien', () => {
		const kpis = buildDashboardKpis(10, [], 0, 0);
		expect(kpis[1].detail).toBe('Aucune alerte active');
		expect(kpis[2].detail).toBe('Aucun rappel');
	});
});

describe('buildDashboardTasks — ce qu’il reste à faire', () => {
	it('rappelle les contrôles qualité en attente', () => {
		const [tache] = buildDashboardTasks([], 3);
		expect(tache).toMatchObject({
			variant: 'info',
			text: expect.stringContaining('3 contrôle(s)')
		});
	});

	it('renvoie vers le suivi du rappel actif', () => {
		const taches = buildDashboardTasks([alert({ type: 'PRODUCT_RECALL', message: 'Listeria' })], 0);
		expect(taches[0]).toMatchObject({
			variant: 'warn',
			link: { href: '/rappels-produits', label: 'voir le suivi' }
		});
	});

	it('alerte spécifiquement quand le rappel est peut-être incomplet', () => {
		const [tache] = buildDashboardTasks(
			[alert({ type: 'RECALL_DEPTH_SATURATION', message: 'Profondeur saturée' })],
			0
		);
		expect(tache.text).toMatch(/Rappel incomplet/);
	});

	it('ignore un rappel déjà clôturé', () => {
		expect(buildDashboardTasks([alert({ type: 'PRODUCT_RECALL', statut: 'RESOLVED' })], 0)).toEqual(
			[]
		);
	});
});

describe('movementsToEvents', () => {
	it('nomme l’événement EPCIS et le lot concerné', () => {
		const [event] = movementsToEvents([
			{
				id: 1,
				type_action: 'EXPEDITION',
				quantite: 10,
				unite: 'L',
				created_at: new Date().toISOString(),
				lot: { id: 'lot-1', produit: { nom: 'Lait 1L' } }
			}
		]);

		expect(event.title).toBe('TransactionEvent — expédition');
		expect(event.meta).toBe('Lot lot-1 · Lait 1L');
		expect(event.when).toMatch(/Aujourd'hui/);
	});

	it('ne laisse pas un lot anonyme sans repère', () => {
		const [event] = movementsToEvents([
			{
				id: 1,
				type_action: 'RECEPTION',
				quantite: 1,
				unite: 'L',
				created_at: '2026-01-05T09:00:00.000Z'
			}
		]);
		expect(event.meta).toBe('Lot — ·');
	});
});

describe('buildPortailStats', () => {
	it('met en avant les expéditions qui ne sont pas encore livrées', () => {
		const [clients, expeditions] = buildPortailStats(
			[{ id: 'c1' }, { id: 'c2' }],
			[{ statut_livraison: 'EN_TRANSIT' }, { statut_livraison: 'LIVRE' }]
		);

		expect(clients.value).toBe('2');
		expect(expeditions).toMatchObject({ value: '1', accent: 'warn' });
	});

	it('n’attire pas l’attention quand tout est livré', () => {
		const [, expeditions] = buildPortailStats([], [{ statut_livraison: 'LIVRE' }]);
		expect(expeditions.accent).toBeUndefined();
	});
});

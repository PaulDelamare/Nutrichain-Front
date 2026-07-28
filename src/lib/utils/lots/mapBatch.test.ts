import { describe, it, expect } from 'vitest';
import {
	batchToRow,
	batchToSheet,
	auditLogsToBatchMouvements,
	movementToBatchMouvement
} from './mapBatch';
import type { ApiBatch } from '$lib/Api/traceability.server';
import type { ApiAuditLog } from '$lib/Api/organization.server';

function batch(statut: string): ApiBatch {
	return { id: 'lot-1', lot_number: 'L1', statut } as ApiBatch;
}

function batchComplet(partial: Partial<ApiBatch> = {}): ApiBatch {
	return {
		id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
		lot_number: '260711-000201',
		statut: 'EN_STOCK',
		quantite_actuelle: '500',
		unite_code: 'KG',
		date_peremption: '2026-08-01T00:00:00.000Z',
		date_creation: '2026-07-11T08:00:00.000Z',
		produit: { nom: 'Bouteille de Lait 1L', code_gtin: '03701234500012' },
		unite: { nom: 'kilogrammes' },
		user: { name: 'Marie Dupont' },
		materiel: {
			nom: 'Cuve 3',
			lieu: { nom: 'Usine Loire' },
			temp_actuelle: 4
		},
		...partial
	};
}

describe('mapBatch — mapStatut', () => {
	it('mappe BLOQUE sur quarantaine', () => {
		expect(batchToRow(batch('BLOQUE')).statut).toBe('quarantaine');
	});

	it('mappe ALERTE sur surveillance (lot rappelé)', () => {
		expect(batchToRow(batch('ALERTE')).statut).toBe('surveillance');
	});

	it('mappe EN_STOCK sur conforme', () => {
		expect(batchToRow(batch('EN_STOCK')).statut).toBe('conforme');
	});

	it('mappe EN_ATTENTE_QC sur l’attente de contrôle', () => {
		expect(batchToRow(batch('EN_ATTENTE_QC')).statut).toBe('attente_qc');
	});

	it('mappe EN_PRODUCTION / EPUISE / REBUT (statuts API réels)', () => {
		expect(batchToRow(batch('EN_PRODUCTION')).statut).toBe('en_production');
		expect(batchToRow(batch('EPUISE')).statut).toBe('epuise');
		expect(batchToRow(batch('REBUT')).statut).toBe('rebut');
	});
});

describe('batchToRow — la ligne du tableau de recherche', () => {
	it('identifie le lot par son numéro GS1', () => {
		expect(batchToRow(batchComplet()).lotNumber).toBe('260711-000201');
	});

	it('retombe sur un identifiant court quand le lot n’a pas de numéro GS1', () => {
		expect(batchToRow(batchComplet({ lot_number: null })).lotNumber).toBe('aaaaaaaa');
	});

	it('reprend la température du matériel qui porte le lot', () => {
		expect(batchToRow(batchComplet()).temperature).toBe('4 °C');
	});

	// La colonne « Dernière temp. » vide en dur laissait croire que rien n'est mesuré.
	it('utilise le relevé du capteur quand le lot ne porte pas sa propre température', () => {
		const row = batchToRow(
			batchComplet({ materiel: { nom: 'Cuve 3' }, id_materiel_actuel: 'frigo-1' }),
			new Map([['frigo-1', 6.5]])
		);
		expect(row.temperature).toBe('6.5 °C');
	});

	it('affiche un tiret plutôt qu’une fausse température quand rien n’est mesuré', () => {
		const row = batchToRow(batchComplet({ materiel: undefined, id_materiel_actuel: null }));
		expect(row.temperature).toBe('—');
	});

	it('n’invente ni produit, ni GTIN, ni site quand l’API ne les joint pas', () => {
		const row = batchToRow(
			batchComplet({ produit: undefined, materiel: undefined, id_materiel_actuel: null })
		);
		expect(row).toMatchObject({ produit: '—', gtin: '—', site: '—' });
	});
});

describe('batchToSheet — la fiche lot', () => {
	it('résume l’identité du lot telle que l’API la fournit', () => {
		const sheet = batchToSheet(batchComplet());

		expect(sheet).toMatchObject({
			produit: 'Bouteille de Lait 1L',
			gtin: '03701234500012',
			dlc: '01/08/2026',
			quantite: '500 kilogrammes',
			statut: 'conforme',
			statutRaw: 'EN STOCK',
			createdBy: 'Marie Dupont',
			site: 'Usine Loire',
			zone: 'Cuve 3',
			createdAtLabel: 'Créé le 11/07/2026'
		});
	});

	/**
	 * #81 — La fiche était titrée « Fiche lot aaaaaaaa-bbbb-… » alors que l'utilisateur venait d'y
	 * arriver en cliquant sur « 260711-000201 ». L'identifiant technique reste dans l'URL ; le
	 * numéro d'étiquette doit exister dans la fiche pour pouvoir la titrer.
	 */
	it('porte le numéro d’étiquette en plus de l’identifiant technique (#81)', () => {
		const sheet = batchToSheet(batchComplet());

		expect(sheet.id).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
		expect(sheet.lotNumber).toBe('260711-000201');
	});

	it('se replie sur un préfixe court quand le lot n’a pas de numéro', () => {
		expect(batchToSheet(batchComplet({ lot_number: null })).lotNumber).toBe('aaaaaaaa');
	});

	it('retombe sur le code unité quand l’unité n’a pas de nom', () => {
		expect(batchToSheet(batchComplet({ unite: undefined })).quantite).toBe('500 KG');
	});

	it('ne prétend pas connaître une DLC absente', () => {
		expect(batchToSheet(batchComplet({ date_peremption: null })).dlc).toBe('—');
	});

	it('ne prétend pas connaître une date de création absente', () => {
		expect(batchToSheet(batchComplet({ date_creation: undefined })).createdAtLabel).toBe('—');
	});

	it('n’affiche aucun pin de carte quand le site est inconnu', () => {
		const sheet = batchToSheet(batchComplet({ materiel: undefined }));
		expect(sheet.mapPin).toBeNull();
	});

	it('place le pin sur les coordonnées de l’emplacement du lot', () => {
		const sheet = batchToSheet(
			batchComplet({
				materiel: {
					nom: 'Cuve 3',
					lieu: { nom: 'Ligne de conditionnement', latitude: '48.833450', longitude: '2.287281' }
				}
			})
		);

		expect(sheet.mapPin).toEqual({
			lat: 48.83345,
			lng: 2.287281,
			label: 'Ligne de conditionnement',
			sublabel: 'Cuve 3'
		});
	});

	/**
	 * ⚠️ « Usine Loire » posait un pin sur Nantes par regex sur le nom du lieu, présenté comme une
	 * donnée de la base (#23). Un lieu non positionné ne rend plus aucun repère.
	 */
	it('n’invente pas de pin à partir du nom du site', () => {
		expect(batchToSheet(batchComplet()).mapPin).toBeNull();
	});

	it('n’invente pas d’auteur pour un lot créé par un service', () => {
		expect(batchToSheet(batchComplet({ user: undefined })).createdBy).toBe('—');
	});

	it('rend l’historique du lot à partir de ses mouvements', () => {
		const sheet = batchToSheet(
			batchComplet({
				mouvements: [
					{
						id: 1,
						type_action: 'RECEPTION',
						quantite: 500,
						unite: 'KG',
						created_at: '2026-07-11T08:00:00.000Z'
					}
				]
			})
		);
		expect(sheet.events).toHaveLength(1);
		expect(sheet.events[0].title).toBe('Réception');
	});

	it('rend un historique vide plutôt que de planter quand aucun mouvement n’existe', () => {
		expect(batchToSheet(batchComplet()).events).toEqual([]);
	});
});

describe('auditLogsToBatchMouvements', () => {
	function log(partial: Partial<ApiAuditLog> = {}): ApiAuditLog {
		return {
			id: 1,
			action: 'LIFT_BATCH_QUARANTINE',
			entity: 'Batch',
			entity_id: 'lot-1',
			horodatage: '2026-07-11T10:00:00.000Z',
			...partial
		};
	}

	// Repli pour une API antérieure à l'écriture systématique des Batch_Mouvement : l'audit
	// conserve encore les décisions qualité (levée, rappel) sous un autre vocabulaire.
	it('traduit une action d’audit en étape d’historique', () => {
		const [m] = auditLogsToBatchMouvements([log()]);
		expect(m).toMatchObject({ type_action: 'LEVEE_QUARANTAINE', created_at: log().horodatage });
	});

	it('conserve le code brut d’une action non répertoriée', () => {
		const [m] = auditLogsToBatchMouvements([log({ action: 'ACTION_FUTURE' })]);
		expect(m.type_action).toBe('ACTION_FUTURE');
	});

	it('n’invente pas de quantité pour une décision qui n’en déplace aucune', () => {
		const [m] = auditLogsToBatchMouvements([log()]);
		expect(m).toMatchObject({ quantite: '—', unite: '' });
	});

	it('transmet le contexte de la décision comme métadonnée', () => {
		const [m] = auditLogsToBatchMouvements([log({ nouvelle_valeur: { motif: 'Contrôle OK' } })]);
		expect(m.metadata).toEqual({ motif: 'Contrôle OK' });
	});

	it('accepte une décision sans contexte enregistré', () => {
		const [m] = auditLogsToBatchMouvements([log()]);
		expect(m.metadata).toBeNull();
	});
});

describe('movementToBatchMouvement', () => {
	it('reprend le mouvement de l’organisation tel quel dans l’historique du lot', () => {
		const m = movementToBatchMouvement({
			id: 7,
			type_action: 'EXPEDITION',
			quantite: 120,
			unite: 'L',
			created_at: '2026-07-12T09:00:00.000Z',
			user: { name: 'Paul' }
		});

		expect(m).toEqual({
			id: 7,
			type_action: 'EXPEDITION',
			quantite: 120,
			unite: 'L',
			created_at: '2026-07-12T09:00:00.000Z',
			user: { name: 'Paul' },
			metadata: null
		});
	});

	/**
	 * ⚠️ Cœur de #30 côté front. L'API écrit déjà le motif dans `metadata` ; le jeter ici
	 * rendait la frise muette après une levée — le jury voyait « rien n'a bougé ».
	 */
	it('conserve le motif d’une levée de quarantaine', () => {
		const m = movementToBatchMouvement({
			id: 8,
			type_action: 'LEVEE_QUARANTAINE',
			quantite: 500,
			unite: 'KG',
			created_at: '2026-07-12T11:00:00.000Z',
			metadata: { motif: '2e contrôle conforme', statut_resultant: 'EN_STOCK' }
		});

		expect(m.metadata).toEqual({
			motif: '2e contrôle conforme',
			statut_resultant: 'EN_STOCK'
		});
	});
});

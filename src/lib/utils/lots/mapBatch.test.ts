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

	// Les levées de quarantaine et rappels n'écrivent pas de Batch_Mouvement : sans cette
	// traduction, l'historique du lot reste muet sur les décisions qualité.
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
});

import { describe, it, expect } from 'vitest';
import { movementsToLotEvents } from './lotEvents';
import type { ApiBatchMouvement } from '$lib/Api/traceability.server';

function mvt(partial: Partial<ApiBatchMouvement>): ApiBatchMouvement {
	return {
		id: 1,
		type_action: 'RECEPTION',
		quantite: 500,
		unite: 'KG',
		created_at: '2026-07-11T10:30:00.000Z',
		...partial
	};
}

describe('movementsToLotEvents', () => {
	it('ne rend aucune étape sans mouvement', () => {
		expect(movementsToLotEvents([])).toEqual([]);
	});

	it('traduit le code brut en libellé lisible', () => {
		const [e] = movementsToLotEvents([mvt({ type_action: 'LEVEE_QUARANTAINE' })]);
		expect(e.title).toBe('Levée de quarantaine');
	});

	it('affiche le code brut d’une étape inconnue plutôt que de la masquer', () => {
		const [e] = movementsToLotEvents([mvt({ type_action: 'ETAPE_FUTURE' })]);
		expect(e.title).toBe('ETAPE_FUTURE');
		expect(e.tone).toBe('neutral');
	});

	it('distingue la quarantaine (réversible) du rappel (irréversible)', () => {
		const [quarantaine] = movementsToLotEvents([mvt({ type_action: 'QUARANTAINE_FROID' })]);
		const [rappel] = movementsToLotEvents([mvt({ type_action: 'RAPPEL' })]);

		expect(quarantaine.tone).toBe('warn');
		expect(rappel.tone).toBe('danger');
		expect(quarantaine.tone).not.toBe(rappel.tone);
	});

	it('expose la CAUSE d’une quarantaine froid, pas seulement son existence', () => {
		const [e] = movementsToLotEvents([
			mvt({
				type_action: 'QUARANTAINE_FROID',
				metadata: { peakTemp: 9.2, threshold: 4, sensorId: 'CAP-01' }
			})
		]);
		expect(e.detail).toContain('Pic 9.2 °C (seuil 4 °C)');
		expect(e.detail).toContain('capteur CAP-01');
	});

	it('n’affiche pas une réception NON CONFORME comme une étape normale', () => {
		const [e] = movementsToLotEvents([
			mvt({ metadata: { statut_controle: 'NONCONFORME', quarantaine: true } })
		]);
		expect(e.tone).toBe('warn');
		expect(e.detail).toContain('lot placé en quarantaine');
	});

	it('affiche une réception conforme comme une étape normale', () => {
		const [e] = movementsToLotEvents([
			mvt({ metadata: { statut_controle: 'OK', quarantaine: false } })
		]);
		expect(e.tone).toBe('ok');
		expect(e.detail).not.toContain('quarantaine');
	});

	it('expose le motif d’une décision qualité', () => {
		const [e] = movementsToLotEvents([
			mvt({ type_action: 'LEVEE_QUARANTAINE', metadata: { motif: '2e contrôle conforme' } })
		]);
		expect(e.detail).toContain('Motif : 2e contrôle conforme');
	});

	it('n’invente aucun contexte quand l’API n’en fournit pas', () => {
		const [e] = movementsToLotEvents([mvt({ type_action: 'EXPEDITION', metadata: null })]);
		expect(e.detail).toBe('500 KG');
	});

	it('nomme l’opérateur quand il est connu', () => {
		const [e] = movementsToLotEvents([mvt({ user: { name: 'Marie Dupont' } })]);
		expect(e.detail).toContain('par Marie Dupont');
	});

	it('reste muet sur l’auteur quand l’API ne le nomme pas', () => {
		const [e] = movementsToLotEvents([mvt({ user: null })]);
		expect(e.detail).not.toContain('par ');
	});

	it('date et horodate chaque étape', () => {
		const [e] = movementsToLotEvents([mvt({ created_at: '2026-07-11T10:30:00.000Z' })]);
		expect(e.day).toBe('11/07/2026');
		expect(e.time).toMatch(/^\d{2}:\d{2}$/);
	});
});

describe('movementsToLotEvents — contrôle qualité', () => {
	const qc = (metadata: Record<string, unknown>) =>
		movementsToLotEvents([mvt({ type_action: 'CONTROLE_QUALITE', metadata })])[0];

	it('dit que le lot a été libéré après un contrôle conforme', () => {
		const e = qc({ resultat: 'CONFORME', type_test: 'Microbio', statut_resultant: 'EN_STOCK' });
		expect(e.tone).toBe('ok');
		expect(e.detail).toContain('Microbio : Conforme — lot libéré');
	});

	// Un contrôle non conforme rendu comme une étape banale fait rater la décision à prendre.
	it('dit que le lot est parti en quarantaine après un contrôle non conforme', () => {
		const e = qc({ resultat: 'NON_CONFORME', type_test: 'Microbio', statut_resultant: 'BLOQUE' });
		expect(e.tone).toBe('warn');
		expect(e.detail).toContain('Microbio : Non conforme — lot placé en quarantaine');
	});

	it('n’annonce aucune suite quand le statut résultant est inconnu', () => {
		const e = qc({ resultat: 'CONFORME', type_test: 'Microbio' });
		expect(e.detail).toContain('Microbio : Conforme');
		expect(e.detail).not.toContain('—');
	});

	it('n’invente pas de type de test manquant', () => {
		const e = qc({ resultat: 'CONFORME' });
		expect(e.detail).toBe('500 KG');
	});
});

describe('movementsToLotEvents — étapes de transformation', () => {
	it('distingue la production de la consommation', () => {
		const [entree] = movementsToLotEvents([mvt({ type_action: 'TRANSFORMATION_ENTREE' })]);
		const [sortie] = movementsToLotEvents([mvt({ type_action: 'TRANSFORMATION_SORTIE' })]);

		expect(entree.title).toBe('Transformation — production');
		expect(sortie.title).toBe('Transformation — consommation');
	});

	it('ne signale rien d’anormal sur une excursion sans relevé exploitable', () => {
		const [e] = movementsToLotEvents([
			mvt({ type_action: 'QUARANTAINE_FROID', metadata: { sensorId: 'CAP-01' } })
		]);
		expect(e.detail).toContain('capteur CAP-01');
		expect(e.detail).not.toContain('Pic');
	});

	it('ignore une métadonnée qui n’est ni texte ni nombre', () => {
		const [e] = movementsToLotEvents([
			mvt({ type_action: 'RAPPEL', metadata: { motif: { texte: 'objet' } } })
		]);
		expect(e.detail).toBe('500 KG');
	});

	it('nomme un déplacement entre deux équipements', () => {
		const [e] = movementsToLotEvents([
			mvt({ type_action: 'DEPLACEMENT', metadata: { from: 'frigo-1', to: 'frigo-2' } })
		]);
		expect(e.title).toBe('Déplacement');
		expect(e.detail).toContain('De frigo-1 vers frigo-2');
	});

	it('expose le motif d’une mise au rebut', () => {
		const [e] = movementsToLotEvents([
			mvt({ type_action: 'MISE_AU_REBUT', metadata: { motif: 'DLC dépassée' } })
		]);
		expect(e.title).toBe('Mise au rebut');
		expect(e.tone).toBe('danger');
		expect(e.detail).toContain('Motif : DLC dépassée');
	});
});

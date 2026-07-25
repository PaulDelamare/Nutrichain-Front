import { describe, it, expect } from 'vitest';
import { matchesTextQuery, filterRowsByText } from './filterByText';

type Ligne = { ref: string; client: string | null; colis: number };

const lignes: Ligne[] = [
	{ ref: 'EXP-001', client: 'Carrefour Nantes', colis: 12 },
	{ ref: 'EXP-002', client: null, colis: 7 },
	{ ref: 'EXP-003', client: 'Leclerc Rennes', colis: 3 }
];

describe('matchesTextQuery', () => {
	it('laisse tout passer sur une requête vide ou blanche', () => {
		expect(matchesTextQuery(['abc'], '')).toBe(true);
		expect(matchesTextQuery(['abc'], '   ')).toBe(true);
	});

	it('ignore la casse et les espaces autour de la requête', () => {
		expect(matchesTextQuery(['Carrefour Nantes'], '  nantes ')).toBe(true);
	});

	it('cherche aussi dans les valeurs numériques', () => {
		expect(matchesTextQuery([12], '12')).toBe(true);
	});

	it('ne plante pas sur un champ absent', () => {
		expect(matchesTextQuery([null, undefined, 'ok'], 'ok')).toBe(true);
		expect(matchesTextQuery([null, undefined], 'ok')).toBe(false);
	});
});

describe('filterRowsByText', () => {
	it('renvoie la liste intacte quand rien n’est cherché', () => {
		expect(filterRowsByText(lignes, '  ', (l) => [l.ref])).toHaveLength(3);
	});

	it('ne garde que les lignes dont un des champs choisis correspond', () => {
		const trouves = filterRowsByText(lignes, 'rennes', (l) => [l.ref, l.client]);
		expect(trouves.map((l) => l.ref)).toEqual(['EXP-003']);
	});

	it('renvoie une liste vide quand rien ne correspond — pas la liste entière', () => {
		expect(filterRowsByText(lignes, 'introuvable', (l) => [l.ref, l.client])).toEqual([]);
	});
});

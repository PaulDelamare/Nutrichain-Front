import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { numeroLot, libelleLotRappel } from './lotLabel';

const lot = (extra: Partial<Parameters<typeof numeroLot>[0]> = {}) => ({
	id: '2a71fc4a-76e6-423f-8b00-05941af0b8ca',
	lot_number: '260726-IXWL0H',
	statut: 'EN_STOCK',
	produit: { nom: 'Bouteille de Lait 1L (Entier)' },
	...extra
});

describe('numeroLot', () => {
	it('rend le numéro de l’étiquette quand il existe', () => {
		expect(numeroLot(lot())).toBe('260726-IXWL0H');
	});

	it('se replie sur un préfixe court quand le lot n’a pas de numéro', () => {
		// Jamais l'UUID entier : illisible, et il déborde de tous les sélecteurs.
		expect(numeroLot(lot({ lot_number: null }))).toBe('2a71fc4a');
		expect(numeroLot(lot({ lot_number: undefined }))).toBe('2a71fc4a');
	});
});

describe('libelleLotRappel', () => {
	it('nomme le produit, le numéro de lot et le statut', () => {
		expect(libelleLotRappel(lot())).toBe(
			'Bouteille de Lait 1L (Entier) — 260726-IXWL0H (EN_STOCK)'
		);
	});

	it('ne laisse jamais l’UUID tenir lieu de nom de produit', () => {
		// Le défaut de #80 : `produit: b.produit?.nom ?? b.id` mettait l'UUID à la place du produit.
		const libelle = libelleLotRappel(lot({ produit: null }));

		expect(libelle).toContain('Produit');
		expect(libelle).not.toContain('2a71fc4a-76e6');
	});
});

/**
 * #80 — La règle « numéro de lot, ou repli court » était recopiée dans cinq écrans et oubliée dans
 * un sixième. Le défaut n'était pas une faute de frappe : c'était une règle métier sans propriétaire.
 *
 * Ce test échoue si un écran la réécrit à la main au lieu d'appeler `numeroLot`.
 */
describe('la règle de nommage d’un lot n’est écrite qu’une fois (#80)', () => {
	it('aucun écran ne recopie le repli sur l’identifiant', () => {
		const racine = path.join(process.cwd(), 'src', 'routes');
		const fautifs: string[] = [];

		const parcourir = (dossier: string) => {
			for (const entree of readdirSync(dossier)) {
				const chemin = path.join(dossier, entree);
				if (statSync(chemin).isDirectory()) parcourir(chemin);
				else if (/\.(ts|svelte)$/.test(chemin) && !chemin.includes('.test.')) {
					readFileSync(chemin, 'utf-8')
						.split('\n')
						.forEach((ligne, index) => {
							if (/lot_number\s*\?\?[^\n]*\.slice\(\s*0\s*,\s*8\s*\)/.test(ligne)) {
								fautifs.push(`${path.relative(process.cwd(), chemin)}:${index + 1}`);
							}
						});
				}
			}
		};
		parcourir(racine);

		expect(fautifs).toEqual([]);
	});
});

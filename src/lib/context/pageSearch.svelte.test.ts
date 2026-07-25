import { describe, it, expect } from 'vitest';
import { PageSearchContext } from './pageSearch.svelte';

const PLACEHOLDER_INACTIF = 'Recherche non disponible sur cette page';

describe('PageSearchContext', () => {
	it('démarre inactif — la barre ne promet pas une recherche qui n’existe pas', () => {
		const ctx = new PageSearchContext();
		expect(ctx.active).toBe(false);
		expect(ctx.placeholder).toBe(PLACEHOLDER_INACTIF);
		expect(ctx.query).toBe('');
	});

	it('s’active avec le libellé fourni par la page', () => {
		const ctx = new PageSearchContext();
		ctx.configure('Rechercher rappel, produit, lot…');

		expect(ctx.active).toBe(true);
		expect(ctx.placeholder).toBe('Rechercher rappel, produit, lot…');
	});

	it('vide la recherche sans désactiver la barre', () => {
		const ctx = new PageSearchContext();
		ctx.configure('Rechercher un lot');
		ctx.query = 'lait';
		ctx.resetQuery();

		expect(ctx.query).toBe('');
		expect(ctx.active).toBe(true);
	});

	// Sans remise à zéro au démontage, la requête de la page précédente reste affichée alors
	// qu'elle ne filtre plus rien.
	it('oublie tout au départ de la page', () => {
		const ctx = new PageSearchContext();
		ctx.configure('Rechercher un lot');
		ctx.query = 'lait';
		ctx.deactivate();

		expect(ctx.active).toBe(false);
		expect(ctx.query).toBe('');
		expect(ctx.placeholder).toBe(PLACEHOLDER_INACTIF);
	});
});

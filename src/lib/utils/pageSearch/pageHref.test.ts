import { describe, it, expect } from 'vitest';
import { pageHref } from './pageHref';

describe('pageHref', () => {
	/**
	 * ⚠️ Perdre `q` en changeant de page ramènerait l'utilisateur au catalogue complet : il croirait
	 * avoir parcouru ses résultats de recherche alors qu'il en a changé.
	 */
	it('conserve la recherche en cours en changeant de page', () => {
		const href = pageHref('/recherche-lots', new URLSearchParams('q=lait'), 3);
		expect(href).toBe('/recherche-lots?q=lait&page=3');
	});

	it('retire le paramètre sur la première page — une seule URL par écran', () => {
		const href = pageHref('/recherche-lots', new URLSearchParams('q=lait&page=4'), 1);
		expect(href).toBe('/recherche-lots?q=lait');
	});

	it('retombe sur le chemin nu quand aucun paramètre ne subsiste', () => {
		expect(pageHref('/recherche-lots', new URLSearchParams('page=2'), 1)).toBe('/recherche-lots');
	});

	it('remplace la page courante au lieu de l’empiler', () => {
		const href = pageHref('/recherche-lots', new URLSearchParams('page=2'), 5);
		expect(href).toBe('/recherche-lots?page=5');
	});

	it('ne modifie pas les paramètres reçus', () => {
		const params = new URLSearchParams('q=lait');
		pageHref('/recherche-lots', params, 3);
		expect(params.toString()).toBe('q=lait');
	});

	it('accepte un autre nom de paramètre pour une seconde liste sur la même page', () => {
		const href = pageHref('/receptions', new URLSearchParams(), 2, 'receptionPage');
		expect(href).toBe('/receptions?receptionPage=2');
	});
});

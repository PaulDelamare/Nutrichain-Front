import { describe, it, expect } from 'vitest';
import { pendingQcToLots } from './pendingQc';
import type { ApiPendingQcBatch } from '$lib/Api/organization.server';

function batch(partial: Partial<ApiPendingQcBatch> = {}): ApiPendingQcBatch {
	return {
		id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
		lot_number: '260713-000203',
		quantite_actuelle: 1200,
		unite_code: 'L',
		date_creation: new Date().toISOString(),
		produit: { nom: 'Bouteille de Lait 1L' },
		...partial
	};
}

describe('pendingQcToLots', () => {
	it('ne rend aucun lot quand rien n’attend de contrôle', () => {
		expect(pendingQcToLots([])).toEqual([]);
	});

	it('affiche le numéro de lot GS1, pas l’UUID (c’est ce que l’opérateur lit sur l’étiquette)', () => {
		const [lot] = pendingQcToLots([batch()]);
		expect(lot.lot).toBe('260713-000203');
	});

	it('retombe sur un identifiant court quand le lot n’a pas de numéro GS1', () => {
		const [lot] = pendingQcToLots([batch({ lot_number: null })]);
		expect(lot.lot).toBe('AAAAAAAA');
		expect(lot.lot).not.toContain('-');
	});

	it('n’invente pas de produit quand l’API n’en fournit pas', () => {
		const [lot] = pendingQcToLots([batch({ produit: undefined })]);
		expect(lot.produit).toBe('—');
	});

	it('dit depuis combien de temps le lot attend — un lot oublié est un lot perdu', () => {
		const troisJours = new Date(Date.now() - 3 * 86_400_000).toISOString();
		const [lot] = pendingQcToLots([batch({ date_creation: troisJours })]);
		expect(lot.depuis).toBe('depuis 3 jours');
	});

	it('dit « aujourd’hui » pour un lot tout juste produit', () => {
		const [lot] = pendingQcToLots([batch()]);
		expect(lot.depuis).toBe("aujourd'hui");
	});
});

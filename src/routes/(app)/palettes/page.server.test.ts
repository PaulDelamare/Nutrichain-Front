import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import type { DonneesPalettes } from '$lib/types/palette';

vi.mock('$lib/Api/logistics.server', () => ({
	getLogisticUnitBySscc: vi.fn()
}));

const { getLogisticUnitBySscc } = await import('$lib/Api/logistics.server');
const { load } = await import('./+page.server');
const { normaliserSscc } = await import('$lib/utils/palettes/sscc');

const resoudre = vi.mocked(getLogisticUnitBySscc);

const PALETTE = {
	id: 'palette-1',
	sscc: '034567890000000606',
	source: 'INTERNE',
	created_at: '2026-07-30T10:00:00.000Z',
	contient_lot_rappele: false,
	id_materiel: 'frigo-1',
	positions_divergentes: false,
	lots: [
		{
			id: 'lot-1',
			numero_lot: '260729-AAAAAA',
			produit: 'Beurre doux',
			gtin: '3401234567890',
			quantite: 30,
			unite: 'kg',
			statut: 'EN_STOCK',
			date_peremption: null
		}
	]
};

const charger = (sscc?: string) =>
	load({
		fetch: globalThis.fetch,
		cookies: { getAll: () => [] } as unknown as Cookies,
		url: new URL(`http://front.test/palettes${sscc === undefined ? '' : `?sscc=${sscc}`}`)
	} as unknown as Parameters<typeof load>[0]) as Promise<DonneesPalettes>;

beforeEach(() => vi.clearAllMocks());

/**
 * Le SSCC arrive d'une douchette ou d'un copier-coller : espaces, tirets, et parfois son préfixe
 * d'AI `00` — l'étiquette encode l'element string complet. La route de l'API attend les 18
 * chiffres seuls ; sans nettoyage, une lecture parfaitement valide partait en 400.
 */
describe('normaliserSscc', () => {
	it('accepte 18 chiffres', () => {
		expect(normaliserSscc('034567890000000606')).toBe('034567890000000606');
	});

	it('retire le préfixe d’AI 00 que porte l’étiquette', () => {
		expect(normaliserSscc('00034567890000000606')).toBe('034567890000000606');
	});

	it('tolère les espaces et tirets d’une saisie humaine', () => {
		expect(normaliserSscc('0345 6789 0000 0006 06')).toBe('034567890000000606');
		expect(normaliserSscc('0345-6789-0000-0006-06')).toBe('034567890000000606');
	});

	it('refuse ce qui n’est pas un SSCC', () => {
		for (const invalide of ['', '12345', '3401234567890', 'ABCDEFGHIJKLMNOPQR']) {
			expect(normaliserSscc(invalide)).toBeNull();
		}
	});
});

describe('page palettes', () => {
	it('n’interroge pas l’API tant qu’aucun SSCC n’est saisi', async () => {
		const data = await charger();

		expect(data.resultat.etat).toBe('vide');
		expect(resoudre).not.toHaveBeenCalled();
	});

	it('refuse une saisie qui n’a pas la forme d’un SSCC, sans appeler l’API', async () => {
		const data = await charger('3401234567890');

		expect(data.resultat).toMatchObject({ etat: 'invalide' });
		expect(resoudre).not.toHaveBeenCalled();
	});

	it('résout le SSCC en retirant son préfixe d’AI avant d’appeler l’API', async () => {
		resoudre.mockResolvedValue({ ok: true, data: PALETTE } as never);

		const data = await charger('00034567890000000606');

		expect(resoudre).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			'034567890000000606'
		);
		expect(data.resultat).toMatchObject({ etat: 'trouvee' });
	});

	/**
	 * Rendre une palette vide sur une panne la ferait passer pour une palette qui ne porte plus
	 * rien — et elle serait traitée comme telle. Ne pas savoir doit se dire.
	 */
	it('distingue une panne d’une palette sans contenu', async () => {
		resoudre.mockResolvedValue({ ok: false, message: 'API injoignable.' } as never);

		const data = await charger('034567890000000606');

		expect(data.resultat).toMatchObject({ etat: 'erreur', message: 'API injoignable.' });
	});
});

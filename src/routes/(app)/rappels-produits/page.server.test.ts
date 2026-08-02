/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string, status = 503) => ({ ok: false as const, status, message });

const organization = { getRecalls: vi.fn() };
const traceability = { getBatchList: vi.fn(), triggerRecall: vi.fn() };

vi.mock('$lib/Api/organization.server', () => organization);
vi.mock('$lib/Api/traceability.server', () => traceability);

const { load, actions } = await import('./+page.server');

const QUALITY = { id: 'u1', role: 'quality' };

/** Alerte de rappel telle que l'écrit `recall.service.ts` : le motif et les compteurs sont dans le
 * message, que `alertsToRappels` sait parser. */
const RECALL_ALERT = {
	id: 'a1',
	type: 'PRODUCT_RECALL',
	niveau_gravite: 'CRITIQUE',
	message:
		'RAPPEL DÉCLENCHÉ : Listeria. Source: lot-1. Total lots impactés: 3. Expéditions à notifier: 2.',
	statut: 'ACTIVE',
	related_id: 'lot-1',
	created_at: '2026-08-01T10:00:00.000Z'
};

const recallPage = (rows: unknown[] = [RECALL_ALERT]) =>
	ok({ data: rows, pagination: { page: 1, limit: 25, total: rows.length, totalPages: 1 } });

const lot = (id: string, statut: string) => ({ id, lot_number: id, statut });

const run = (query = '') =>
	(load as any)({
		fetch: vi.fn(),
		cookies: {},
		url: new URL(`http://front.test/rappels-produits${query}`)
	});

/** Les options réellement envoyées à l'API lors du dernier chargement. */
const requete = () => organization.getRecalls.mock.calls.at(-1)?.[2];

beforeEach(() => {
	vi.clearAllMocks();
	organization.getRecalls.mockResolvedValue(recallPage());
	traceability.getBatchList.mockResolvedValue(ok([lot('l1', 'EN_STOCK'), lot('l2', 'BLOQUE')]));
});

describe('chargement des rappels — workflow paginé (alertes)', () => {
	it('mappe les alertes de rappel en rappels et renvoie la pagination', async () => {
		const data = await run();

		expect(data.rappels).toHaveLength(1);
		expect(data.rappels[0]).toMatchObject({
			produit: 'Listeria',
			statut: 'en_cours',
			lots: '3 lot(s) bloqué(s)'
		});
		expect(data.pagination).toMatchObject({ page: 1, total: 1 });
	});

	// Les filtres de colonnes partent à l'API (filtrage sur toute l'organisation), au lieu d'être
	// dérivés de toutes les alertes côté front.
	it('transmet la recherche, le statut et la page à l’API', async () => {
		await run('?page=2&q=listeria&statut=cloture');

		expect(requete()).toMatchObject({ page: 2, q: 'listeria', statut: 'cloture' });
	});

	it('borne la taille de page au sélecteur (?limit=999 → défaut)', async () => {
		await run('?limit=999');
		expect(requete()?.limit).toBe(25);
	});

	it('signale l’erreur API et n’affiche aucun rappel', async () => {
		organization.getRecalls.mockResolvedValue(err('API injoignable'));

		const data = await run();

		expect(data.error).toBe('API injoignable');
		expect(data.rappels).toEqual([]);
	});
});

/**
 * L'état qui fait foi est celui des LOTS (cf. #122). Résoudre l'alerte d'un rappel ne libère pas le
 * lot : le tableau (déduit des alertes) recense le workflow, mais c'est cette liste — les lots au
 * statut `ALERTE` — qui dit ce qui reste réellement immobilisé.
 */
describe('chargement des rappels — marchandise immobilisée (lots)', () => {
	it('remonte les lots réellement sous rappel, même sans aucun rappel dans le workflow', async () => {
		organization.getRecalls.mockResolvedValue(recallPage([]));
		traceability.getBatchList.mockResolvedValue(
			ok([lot('L-1', 'ALERTE'), lot('L-2', 'EN_STOCK'), lot('L-3', 'ALERTE')])
		);

		const data = await run();

		expect(data.rappels).toEqual([]);
		expect(data.lotsSousRappel.map((b: { id: string }) => b.id)).toEqual(['L-1', 'L-3']);
	});

	it('n’offre au déclenchement ni un lot bloqué ni un lot déjà rappelé', async () => {
		traceability.getBatchList.mockResolvedValue(
			ok([lot('L-1', 'ALERTE'), lot('L-2', 'EN_STOCK'), lot('L-3', 'BLOQUE')])
		);

		const data = await run();

		expect(data.batches.map((b: { id: string }) => b.id)).toEqual(['L-2']);
	});

	it('ne présente aucun lot immobilisé quand il n’y en a pas', async () => {
		traceability.getBatchList.mockResolvedValue(ok([lot('L-2', 'EN_STOCK')]));

		expect((await run()).lotsSousRappel).toEqual([]);
	});
});

describe('action recall', () => {
	const recallReq = (fields: Record<string, string>, user: any = QUALITY) => {
		const fd = new FormData();
		Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
		return (actions as any).recall({
			request: { formData: async () => fd },
			fetch: vi.fn(),
			cookies: {},
			locals: { user }
		});
	};

	it('refuse un rôle sans décision qualité (403), sans appeler l’API', async () => {
		const res = await recallReq({ lotId: 'l1', reason: 'Listeria' }, { id: 'o', role: 'operator' });

		expect(res).toMatchObject({ status: 403 });
		expect(traceability.triggerRecall).not.toHaveBeenCalled();
	});

	it('refuse lot ou motif manquant (400)', async () => {
		const res = await recallReq({ lotId: '', reason: 'Listeria' });

		expect(res).toMatchObject({ status: 400 });
		expect(traceability.triggerRecall).not.toHaveBeenCalled();
	});

	it('déclenche le rappel quand tout est valide', async () => {
		traceability.triggerRecall.mockResolvedValue(ok({ recall: true }));

		const res = await recallReq({ lotId: 'l1', reason: 'Listeria' });

		expect(traceability.triggerRecall).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			'l1',
			'Listeria'
		);
		expect(res).toMatchObject({ recall: { recall: true }, lotId: 'l1' });
	});
});

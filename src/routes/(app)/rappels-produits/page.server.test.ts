/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });

const organization = { getAlerts: vi.fn() };
const traceability = { getBatchList: vi.fn(), triggerRecall: vi.fn() };

vi.mock('$lib/Api/organization.server', () => organization);
vi.mock('$lib/Api/traceability.server', () => traceability);

const { load } = await import('./+page.server');

const run = () => (load as any)({ fetch: vi.fn(), cookies: {} });

const lot = (id: string, statut: string) => ({ id, lot_number: id, statut });

beforeEach(() => {
	vi.clearAllMocks();
	organization.getAlerts.mockResolvedValue(ok([]));
});

describe('page Rappels produits — ce que l’écran a le droit d’affirmer', () => {
	/**
	 * LE défaut : les rappels se déduisaient des ALERTES. Résoudre l'alerte d'un rappel ne le clôt
	 * pas — l'API le documente — et l'écran annonçait alors « Aucun rappel produit en cours »
	 * pendant que de la marchandise restait immobilisée au statut `ALERTE`.
	 */
	it('remonte les lots réellement sous rappel, même sans aucune alerte', async () => {
		traceability.getBatchList.mockResolvedValue(
			ok([lot('L-1', 'ALERTE'), lot('L-2', 'EN_STOCK'), lot('L-3', 'ALERTE')])
		);

		const data = await run();

		expect(data.rappels).toEqual([]);
		expect(data.lotsSousRappel.map((b: { id: string }) => b.id)).toEqual(['L-1', 'L-3']);
	});

	/** Le sélecteur ne doit proposer que des lots rappelables : ni bloqués, ni déjà sous rappel. */
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

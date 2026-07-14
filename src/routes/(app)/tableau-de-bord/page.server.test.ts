import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string) => ({ ok: false as const, status: 503, message });

const getAlerts = vi.fn();
const getQualityControls = vi.fn();
const getQuarantineBatches = vi.fn();
const getMovements = vi.fn();
const getBatches = vi.fn();

vi.mock('$lib/Api/organization.server', () => ({
	getAlerts: (...a: unknown[]) => getAlerts(...a),
	getQualityControls: (...a: unknown[]) => getQualityControls(...a),
	getQuarantineBatches: (...a: unknown[]) => getQuarantineBatches(...a),
	getMovements: (...a: unknown[]) => getMovements(...a)
}));

vi.mock('$lib/Api/traceability.server', () => ({
	getBatches: (...a: unknown[]) => getBatches(...a)
}));

const { load } = await import('./+page.server');

const run = () => (load as any)({ fetch: vi.fn(), cookies: {} });

beforeEach(() => {
	getBatches.mockResolvedValue(ok([]));
	getAlerts.mockResolvedValue(ok([]));
	getQualityControls.mockResolvedValue(ok([]));
	getQuarantineBatches.mockResolvedValue(ok([]));
	getMovements.mockResolvedValue(ok([]));
});

describe('chargement du tableau de bord', () => {
	it('signale l’erreur quand les contrôles qualité échouent — sinon la page affirmerait « 0 anomalie »', async () => {
		getQualityControls.mockResolvedValue(err('403 interdit'));

		const data = await run();

		expect(data.error).toBe('403 interdit');
	});

	it('signale l’erreur quand les mouvements échouent', async () => {
		getMovements.mockResolvedValue(err('API injoignable'));

		const data = await run();

		expect(data.error).toBe('API injoignable');
	});

	it('ne compte pas les contrôles conformes dans les anomalies ouvertes', async () => {
		getQualityControls.mockResolvedValue(
			ok([
				{ id: '1', type_test: 'T', resultat: 'CONFORME', date_test: '', lot: { id: 'l' } },
				{ id: '2', type_test: 'T', resultat: 'NON_CONFORME', date_test: '', lot: { id: 'l' } }
			])
		);

		const data = await run();

		const anomalies = data.kpis.find((k: { label: string }) => k.label === 'Anomalies ouvertes');
		expect(anomalies?.value).toBe('1');
	});

	it('ne signale aucune erreur quand tous les appels réussissent', async () => {
		const data = await run();

		expect(data.error).toBeUndefined();
	});
});

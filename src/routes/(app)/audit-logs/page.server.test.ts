/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string, status = 503) => ({ ok: false as const, status, message });

const organization = { getAuditLogs: vi.fn() };
const audit = { verifyAudit: vi.fn() };

vi.mock('$lib/Api/organization.server', () => organization);
vi.mock('$lib/Api/audit.server', () => audit);

const { load, actions } = await import('./+page.server');

const ADMIN = { id: 'u1', role: 'admin' };

const LOG = {
	id: 1,
	action: 'CREATE_SHIPMENT',
	entity: 'Shipment',
	entity_id: 'ship-ab12',
	horodatage: '2026-08-02T10:00:00.000Z',
	ancienne_valeur: null,
	nouvelle_valeur: null
};

const logPage = (rows: unknown[] = [LOG]) =>
	ok({ data: rows, pagination: { page: 1, limit: 25, total: rows.length, totalPages: 1 } });

const run = (query = '', user: any = ADMIN) =>
	(load as any)({
		fetch: vi.fn(),
		cookies: {},
		locals: { user },
		url: new URL(`http://front.test/audit-logs${query}`)
	});

/** Les options réellement envoyées à l'API lors du dernier chargement. */
const requete = () => organization.getAuditLogs.mock.calls.at(-1)?.[2];

beforeEach(() => {
	vi.clearAllMocks();
	organization.getAuditLogs.mockResolvedValue(logPage());
});

describe('chargement du journal d’audit', () => {
	it('mappe les entrées (action et entité traduites) et renvoie la pagination', async () => {
		const data = await run();

		expect(data.rows[0]).toMatchObject({
			action: 'CREATE_SHIPMENT',
			actionLabel: 'Expédition créée',
			entityLabel: 'Expédition',
			entityId: 'ship-ab12'
		});
		expect(data.pagination).toMatchObject({ page: 1, total: 1 });
	});

	// Les filtres de colonnes partent à l'API (filtrage sur tout le journal), au lieu d'être
	// appliqués sur la seule tranche reçue côté front.
	it('transmet les filtres de colonnes et le créneau à l’API', async () => {
		await run(
			'?page=2&action=CREATE_SHIPMENT&entity=Shipment&entity_id=ab12&from=2026-08-01T00:00&to=2026-08-02T12:30'
		);

		expect(requete()).toMatchObject({
			page: 2,
			action: 'CREATE_SHIPMENT',
			entity: 'Shipment',
			entityId: 'ab12',
			from: '2026-08-01T00:00',
			to: '2026-08-02T12:30'
		});
	});

	it('borne la taille de page au sélecteur (?limit=999 → défaut)', async () => {
		await run('?limit=999');
		expect(requete()?.limit).toBe(25);
	});

	it('signale l’erreur API et n’affiche aucune entrée', async () => {
		organization.getAuditLogs.mockResolvedValue(err('API injoignable'));

		const data = await run();

		expect(data.error).toBe('API injoignable');
		expect(data.rows).toEqual([]);
	});

	it('refuse la page à un rôle non-administrateur (403)', async () => {
		await expect(run('', { id: 'v', role: 'viewer' })).rejects.toMatchObject({ status: 403 });
	});
});

describe('action verify', () => {
	const verifyReq = (user: any = ADMIN) =>
		(actions as any).verify({ fetch: vi.fn(), cookies: {}, locals: { user } });

	it('refuse un non-administrateur (403), sans appeler l’API', async () => {
		const res = await verifyReq({ id: 'v', role: 'viewer' });

		expect(res).toMatchObject({ status: 403 });
		expect(audit.verifyAudit).not.toHaveBeenCalled();
	});

	it('renvoie le verdict quand la chaîne est intacte', async () => {
		audit.verifyAudit.mockResolvedValue(ok({ valid: true, rowsChecked: 12 }));

		const res = await verifyReq();

		expect(res).toMatchObject({ verify: { valid: true, rowsChecked: 12 } });
	});
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string, status = 503) => ({ ok: false as const, status, message });

const organization = {
	getMembers: vi.fn(),
	changeMemberRole: vi.fn(),
	revokeMember: vi.fn()
};
const auth = { getMe: vi.fn() };
const identity = { sendInvitation: vi.fn() };

vi.mock('$lib/Api/organization.server', () => organization);
vi.mock('$lib/Api/auth.server', () => auth);
vi.mock('$lib/Api/identity.server', () => identity);

const { load, actions } = await import('./+page.server');

const ADMIN = { id: 'u-admin', role: 'admin' };

const memberPage = (rows: unknown[] = []) =>
	ok({ data: rows, pagination: { page: 1, limit: 25, total: rows.length, totalPages: 1 } });

const MEMBER = {
	id: 'm1',
	role: 'operator',
	user: { id: 'u2', email: 'ana@x.fr', name: 'Ana', twoFactorEnabled: false }
};

const run = (query = '', user: any = ADMIN) =>
	(load as any)({
		fetch: vi.fn(),
		cookies: {},
		locals: { user },
		url: new URL(`http://front.test/utilisateurs${query}`)
	});

/** Les options réellement envoyées à l'API lors du dernier chargement. */
const requete = () => organization.getMembers.mock.calls.at(-1)?.[2];

beforeEach(() => {
	vi.clearAllMocks();
	organization.getMembers.mockResolvedValue(memberPage([MEMBER]));
});

describe('chargement des utilisateurs', () => {
	it('mappe les membres en utilisateurs et renvoie la pagination', async () => {
		const data = await run();

		expect(data.users).toEqual([
			{
				memberId: 'm1',
				userId: 'u2',
				email: 'ana@x.fr',
				role: 'Opérateur',
				rawRole: 'operator',
				mfa: false
			}
		]);
		expect(data.pagination).toMatchObject({ page: 1, total: 1 });
	});

	// Les filtres de colonnes partent à l'API (filtrage sur toute l'organisation), au lieu d'être
	// appliqués sur la seule page reçue côté front.
	it('transmet les filtres de colonnes et la page à l’API', async () => {
		await run('?page=2&email=ana&role=operator&mfa=false');

		expect(requete()).toMatchObject({ page: 2, email: 'ana', role: 'operator', mfa: false });
	});

	it('traduit ?mfa=true en booléen et le reflète dans les filtres affichés', async () => {
		const data = await run('?mfa=true');

		expect(requete()).toMatchObject({ mfa: true });
		expect(data.filters.mfa).toBe('actif');
	});

	it('ignore un mfa malformé (ni true ni false) — aucun filtre MFA', async () => {
		const data = await run('?mfa=peut-etre');

		expect(requete()?.mfa).toBeUndefined();
		expect(data.filters.mfa).toBe('tous');
	});

	it('borne la taille de page au sélecteur (?limit=999 → défaut)', async () => {
		await run('?limit=999');
		expect(requete()?.limit).toBe(25);
	});

	it('honore une taille de page de la liste (?limit=100)', async () => {
		await run('?limit=100');
		expect(requete()?.limit).toBe(100);
	});

	it('signale l’erreur API et n’affiche aucun utilisateur', async () => {
		organization.getMembers.mockResolvedValue(err('API injoignable'));

		const data = await run();

		expect(data.error).toBe('API injoignable');
		expect(data.users).toEqual([]);
	});

	it('refuse la page à un rôle non-administrateur (403)', async () => {
		await expect(run('', { id: 'u-viewer', role: 'viewer' })).rejects.toMatchObject({
			status: 403
		});
	});
});

describe('action invite', () => {
	const inviteReq = (fields: Record<string, string>, user: any = ADMIN) => {
		const fd = new FormData();
		Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
		return (actions as any).invite({
			request: { formData: async () => fd },
			fetch: vi.fn(),
			cookies: {},
			locals: { user }
		});
	};

	it('refuse un non-administrateur (403), sans appeler l’API', async () => {
		const res = await inviteReq({ email: 'x@y.fr', role: 'operator' }, { id: 'v', role: 'viewer' });

		expect(res).toMatchObject({ status: 403 });
		expect(identity.sendInvitation).not.toHaveBeenCalled();
	});

	it('refuse un e-mail vide (400)', async () => {
		const res = await inviteReq({ email: '', role: 'operator' });

		expect(res).toMatchObject({ status: 400 });
		expect(identity.sendInvitation).not.toHaveBeenCalled();
	});

	it('refuse un rôle hors liste d’invitation (400)', async () => {
		const res = await inviteReq({ email: 'x@y.fr', role: 'owner' });

		expect(res).toMatchObject({ status: 400 });
		expect(identity.sendInvitation).not.toHaveBeenCalled();
	});

	it('envoie l’invitation quand tout est valide', async () => {
		auth.getMe.mockResolvedValue(ok({ activeOrgId: 'org-1' }));
		identity.sendInvitation.mockResolvedValue(ok({ id: 'inv-1' }));

		const res = await inviteReq({ email: 'x@y.fr', role: 'operator' });

		expect(identity.sendInvitation).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
			email: 'x@y.fr',
			role: 'operator',
			organizationId: 'org-1'
		});
		expect(res).toMatchObject({ scope: 'invite', success: true });
	});
});

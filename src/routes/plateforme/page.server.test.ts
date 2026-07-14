import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isHttpError } from '@sveltejs/kit';

const getOrganizations = vi.fn();
const createOrganization = vi.fn();
const inviteOrganizationOwner = vi.fn();

vi.mock('$lib/Api/platform.server', () => ({
	getOrganizations: (...a: unknown[]) => getOrganizations(...a),
	createOrganization: (...a: unknown[]) => createOrganization(...a),
	inviteOrganizationOwner: (...a: unknown[]) => inviteOrganizationOwner(...a)
}));

const mod = await import('./+page.server');

const user = (isPlatformAdmin: boolean) => ({
	id: 'u',
	name: 'N',
	email: 'e@x.fr',
	role: null,
	isPlatformAdmin
});

const form = (entries: Record<string, string>) => ({
	request: { formData: async () => ({ get: (k: string) => entries[k] ?? null }) },
	fetch: vi.fn(),
	cookies: {}
});

const statut = async (fn: (e: unknown) => Promise<unknown>, e: unknown) => {
	try {
		await fn(e);
		return 200;
	} catch (err) {
		return isHttpError(err) ? err.status : 'exception';
	}
};

beforeEach(() => {
	getOrganizations.mockResolvedValue({ ok: true, data: [] });
	createOrganization.mockResolvedValue({ ok: true, data: { id: 'o', name: 'X', slug: 'x' } });
	inviteOrganizationOwner.mockResolvedValue({ ok: true, data: {} });
});

describe('console plateforme — gardes de page ET d’action', () => {
	it("refuse l'action create à un non-admin (contournement du garde de layout)", async () => {
		const create = (mod as any).actions.create;
		const s = await statut(create, {
			...form({ name: 'Pirate', slug: 'pirate' }),
			locals: { user: user(false) }
		});

		expect(s).toBe(403);
		expect(createOrganization).not.toHaveBeenCalled();
	});

	it("refuse l'action inviteOwner à un non-admin", async () => {
		const invite = (mod as any).actions.inviteOwner;
		const s = await statut(invite, {
			...form({ organizationId: 'o', email: 'x@y.z' }),
			locals: { user: user(false) }
		});

		expect(s).toBe(403);
		expect(inviteOrganizationOwner).not.toHaveBeenCalled();
	});

	it('refuse le load à un non-admin', async () => {
		const s = await statut((mod as any).load, {
			fetch: vi.fn(),
			cookies: {},
			locals: { user: user(false) }
		});

		expect(s).toBe(403);
	});

	it('laisse un admin de plateforme créer une organisation', async () => {
		const create = (mod as any).actions.create;
		const res = await create({
			...form({ name: 'Fromagerie des Alpes', slug: '' }),
			locals: { user: user(true) }
		});

		expect(createOrganization).toHaveBeenCalledOnce();
		expect(res).toMatchObject({ created: { id: 'o' } });
	});

	it('déduit un slug valide du nom quand le champ est vide', async () => {
		const create = (mod as any).actions.create;
		await create({
			...form({ name: 'Fromagerie des Alpes', slug: '' }),
			locals: { user: user(true) }
		});

		const [, , body] = createOrganization.mock.calls[0];
		expect(body.slug).toBe('fromagerie-des-alpes');
	});
});

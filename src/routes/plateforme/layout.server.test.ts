import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import type { KnownRole } from '$lib/config/roles';

const { load } = await import('./+layout.server');

const run = async (user: { role: KnownRole; isPlatformAdmin: boolean } | null) => {
	const event = {
		locals: { user: user ? { id: 'u', name: 'N', email: 'e', ...user } : undefined },
		url: new URL('http://x/plateforme')
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (load as any)(event).catch((e: unknown) => e);
};

const cible = (e: unknown) => (isRedirect(e) ? (e as { location: string }).location : null);

describe('garde de la console plateforme', () => {
	it('laisse entrer un administrateur de plateforme', async () => {
		const res = await run({ role: null, isPlatformAdmin: true });

		expect(isRedirect(res)).toBe(false);
		expect(res.user.isPlatformAdmin).toBe(true);
	});

	it('renvoie un membre d’organisation vers son espace métier', async () => {
		expect(cible(await run({ role: 'owner', isPlatformAdmin: false }))).toBe('/tableau-de-bord');
	});

	it('renvoie un viewer vers son espace métier', async () => {
		expect(cible(await run({ role: 'viewer', isPlatformAdmin: false }))).toBe('/tableau-de-bord');
	});

	it('renvoie un visiteur non connecté vers la connexion', async () => {
		expect(cible(await run(null))).toContain('/connexion');
	});
});

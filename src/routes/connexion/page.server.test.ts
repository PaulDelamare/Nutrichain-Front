import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

const signIn = vi.fn();

vi.mock('$lib/Api/auth.server', () => ({
	signIn: (...a: unknown[]) => signIn(...a)
}));

const mod = await import('./+page.server');

const fetch = vi.fn();
const cookies = { getAll: () => [] };

function event(body: Record<string, string>, redirectParam?: string) {
	const form = new Map(Object.entries(body));
	return {
		request: { formData: async () => form },
		fetch,
		cookies,
		url: new URL(`http://localhost/connexion${redirectParam ? `?redirect=${redirectParam}` : ''}`)
	};
}

beforeEach(() => {
	signIn.mockReset();
});

describe('connexion — bascule vers le défi 2FA', () => {
	it('redirige vers /connexion/2fa quand le serveur exige un second facteur', async () => {
		signIn.mockResolvedValue({ ok: true, twoFactorRedirect: true });

		const run = (mod as { actions: { default: (e: unknown) => Promise<unknown> } }).actions.default;
		const thrown = await run(event({ email: 'operator@nutrichain.local', password: 'x' })).catch(
			(e: unknown) => e
		);

		expect(isRedirect(thrown)).toBe(true);
		expect((thrown as { location: string }).location).toBe(
			'/connexion/2fa?redirect=%2Ftableau-de-bord'
		);
	});

	it('redirige directement vers la cible quand aucune 2FA n’est requise', async () => {
		signIn.mockResolvedValue({ ok: true, twoFactorRedirect: false });

		const run = (mod as { actions: { default: (e: unknown) => Promise<unknown> } }).actions.default;
		const thrown = await run(event({ email: 'operator@nutrichain.local', password: 'x' })).catch(
			(e: unknown) => e
		);

		expect(isRedirect(thrown)).toBe(true);
		expect((thrown as { location: string }).location).toBe('/tableau-de-bord');
	});

	it('préserve le paramètre redirect dans le lien vers le défi 2FA', async () => {
		signIn.mockResolvedValue({ ok: true, twoFactorRedirect: true });

		const run = (mod as { actions: { default: (e: unknown) => Promise<unknown> } }).actions.default;
		const thrown = await run(
			event({ email: 'operator@nutrichain.local', password: 'x' }, '%2Futilisateurs')
		).catch((e: unknown) => e);

		expect((thrown as { location: string }).location).toBe(
			'/connexion/2fa?redirect=%2Futilisateurs'
		);
	});
});

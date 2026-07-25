import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

const verifyTwoFactorTotp = vi.fn();

vi.mock('$lib/Api/auth.server', () => ({
	verifyTwoFactorTotp: (...a: unknown[]) => verifyTwoFactorTotp(...a)
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
		url: new URL(
			`http://localhost/connexion/2fa${redirectParam ? `?redirect=${redirectParam}` : ''}`
		)
	};
}

beforeEach(() => {
	verifyTwoFactorTotp.mockReset();
});

describe('défi 2FA — vérification du code TOTP', () => {
	it('valide le code et redirige vers la cible', async () => {
		verifyTwoFactorTotp.mockResolvedValue({ ok: true });

		const run = (mod as { actions: { default: (e: unknown) => Promise<unknown> } }).actions.default;
		const thrown = await run(event({ code: '123456' }, '%2Futilisateurs')).catch((e: unknown) => e);

		expect(verifyTwoFactorTotp).toHaveBeenCalledExactlyOnceWith(fetch, cookies, '123456');
		expect(isRedirect(thrown)).toBe(true);
		expect((thrown as { location: string }).location).toBe('/utilisateurs');
	});

	it('redirige vers le tableau de bord par défaut, sans paramètre redirect', async () => {
		verifyTwoFactorTotp.mockResolvedValue({ ok: true });

		const run = (mod as { actions: { default: (e: unknown) => Promise<unknown> } }).actions.default;
		const thrown = await run(event({ code: '123456' })).catch((e: unknown) => e);

		expect((thrown as { location: string }).location).toBe('/tableau-de-bord');
	});

	it('refuse un code invalide sans rediriger', async () => {
		verifyTwoFactorTotp.mockResolvedValue({ ok: false, status: 401, message: 'Code invalide' });

		const run = (mod as { actions: { default: (e: unknown) => Promise<unknown> } }).actions.default;
		const result = await run(event({ code: '000000' }));

		expect(result).toMatchObject({ status: 401, data: { error: 'Code invalide' } });
	});

	it('refuse un code vide sans appeler l’API', async () => {
		const run = (mod as { actions: { default: (e: unknown) => Promise<unknown> } }).actions.default;
		const result = await run(event({ code: '' }));

		expect(verifyTwoFactorTotp).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});
});

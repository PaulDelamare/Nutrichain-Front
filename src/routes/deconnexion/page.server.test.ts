import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

// Une mutation dans un `load` est déclenchée par le PRÉCHARGEMENT au survol
// (`data-sveltekit-preload-data="hover"` dans app.html) : passer la souris sur le lien
// suffisait à détruire la session. La déconnexion doit être une action POST.
const signOut = vi.fn();

vi.mock('$lib/Api/auth.server', () => ({
	signOut: (...a: unknown[]) => signOut(...a)
}));

const mod = await import('./+page.server');

const fetch = vi.fn();
const cookies = { getAll: () => [], delete: vi.fn() };
const event = () => ({ fetch, cookies });

beforeEach(() => {
	signOut.mockReset().mockResolvedValue({ ok: true });
});

describe('déconnexion', () => {
	it('ne déconnecte pas au chargement de la page — sinon un survol du lien suffit', async () => {
		const load = (mod as Record<string, unknown>).load as
			| ((e: unknown) => Promise<unknown>)
			| undefined;

		await load?.(event());

		expect(signOut).not.toHaveBeenCalled();
	});

	it('déconnecte sur POST et redirige vers la connexion', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const run = (mod as any).actions?.default;
		expect(run, 'la route doit exposer une action POST').toBeTypeOf('function');

		const thrown = await run(event()).catch((e: unknown) => e);

		// Les cookies sont ce qui ferme réellement la session : sans cette assertion,
		// `signOut(fetch, {})` passerait le test en laissant l'utilisateur connecté.
		expect(signOut).toHaveBeenCalledExactlyOnceWith(fetch, cookies);
		expect(isRedirect(thrown)).toBe(true);
		expect((thrown as { status: number; location: string }).status).toBe(303);
		expect((thrown as { status: number; location: string }).location).toBe('/connexion');
	});
});

import { describe, it, expect } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { hasAuthSessionCookie, deleteSessionCookies } from './auth.server';

function fakeCookies(entries: Array<{ name: string; value: string }>): Cookies {
	const store = new Map(entries.map((c) => [c.name, c.value]));
	return {
		getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
		delete: (name: string) => store.delete(name)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

describe('hasAuthSessionCookie / deleteSessionCookies — distinguer session et défi 2FA', () => {
	// Les deux cookies contiennent `better-auth` dans leur nom : les confondre a fait disparaître
	// le cookie `two_factor` en pleine connexion (`hooks.server.ts` le traitait comme une session
	// invalide et le supprimait avant que l'écran de défi 2FA n'ait pu s'en servir).
	it('ne considère PAS le cookie two_factor comme une session', () => {
		const cookies = fakeCookies([{ name: 'better-auth.two_factor', value: 'x' }]);
		expect(hasAuthSessionCookie(cookies)).toBe(false);
	});

	it('considère bien le cookie de session comme une session', () => {
		const cookies = fakeCookies([{ name: 'better-auth.session_token', value: 'x' }]);
		expect(hasAuthSessionCookie(cookies)).toBe(true);
	});

	it("ne supprime PAS le cookie two_factor lors du nettoyage d'une session invalide (401)", () => {
		const cookies = fakeCookies([
			{ name: 'better-auth.session_token', value: 'expired' },
			{ name: 'better-auth.two_factor', value: 'pending-challenge' }
		]);

		deleteSessionCookies(cookies);

		const remaining = cookies.getAll().map((c) => c.name);
		expect(remaining).not.toContain('better-auth.session_token');
		expect(remaining).toContain('better-auth.two_factor');
	});
});

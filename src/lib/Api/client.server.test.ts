import { describe, it, expect } from 'vitest';
import { parse, serialize } from 'cookie';
import type { Cookies } from '@sveltejs/kit';
import { applySetCookies } from './client.server';

/**
 * Fake fidèle au vrai comportement de SvelteKit : `set` encode la valeur (comme `cookies.set`
 * réel), `getAll` la décode (comme le vrai `cookies.getAll()`). Un mock naïf qui stocke/relit la
 * valeur telle quelle ne peut PAS reproduire le bug de double encodage — il faut le vrai
 * encode/decode du paquet `cookie` pour que le test ait une chance de le voir.
 */
function fakeCookies(): Cookies {
	const store = new Map<string, string>();
	return {
		set(name: string, value: string) {
			store.set(name, serialize(name, value));
		},
		getAll() {
			return [...store.entries()].map(([name, header]) => {
				const parsed = parse(header);
				return { name, value: parsed[name] ?? '' };
			});
		},
		get(name: string) {
			return this.getAll().find((c: { name: string; value: string }) => c.name === name)?.value;
		},
		delete(name: string) {
			store.delete(name);
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

function fakeApiResponse(setCookieLines: string[]): Response {
	const headers = new Headers();
	for (const line of setCookieLines) headers.append('set-cookie', line);
	return { headers } as Response;
}

describe('applySetCookies — relais des cookies Better-Auth', () => {
	it("relaie une valeur déjà URL-encodée sans la corrompre (cf. bug '%3D' -> '%253D')", () => {
		// Valeur telle qu'émise par Better-Auth : déjà pourvue de caractères encodés (%2F, %3D).
		const cookies = fakeCookies();
		const res = fakeApiResponse([
			'better-auth.two_factor=2fa-abc123.Rr7qJX%2FQPOatdqdUlCt6hbotEsWPHsMJN8bSq4s5HzM%3D; Max-Age=600; Path=/; HttpOnly; SameSite=Lax'
		]);

		applySetCookies(res, cookies);

		// La valeur DÉCODÉE que le reste du code manipule doit être la vraie valeur brute,
		// pas une valeur encore à moitié encodée.
		expect(cookies.getAll()).toEqual([
			{
				name: 'better-auth.two_factor',
				value: '2fa-abc123.Rr7qJX/QPOatdqdUlCt6hbotEsWPHsMJN8bSq4s5HzM='
			}
		]);
	});

	it('round-trip complet : la valeur relayée au serveur doit être identique à celle émise par l’API', () => {
		const originalValue = '2fa-abc123.Rr7qJX/QPOatdqdUlCt6hbotEsWPHsMJN8bSq4s5HzM=';
		const originalHeaderValue = encodeURIComponent(originalValue); // ce que l'API a réellement émis
		const cookies = fakeCookies();
		applySetCookies(
			fakeApiResponse([`better-auth.two_factor=${originalHeaderValue}; Path=/; HttpOnly`]),
			cookies
		);

		// Ce que `buildCookieHeader` (même ré-encodage) enverrait à l'API à la requête suivante
		// doit reproduire EXACTEMENT le texte littéral que l'API avait émis — sinon la vérification
		// signée de Better-Auth échoue (401 « Invalid two factor cookie »).
		const relayedValue = encodeURIComponent(cookies.get('better-auth.two_factor') ?? '');
		expect(relayedValue).toBe(originalHeaderValue);
	});
});

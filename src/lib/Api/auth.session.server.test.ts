import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cookies } from '@sveltejs/kit';

vi.mock('$env/dynamic/private', () => ({ env: { API_URL: 'http://api.test' } }));

const {
	signIn,
	signUp,
	signOut,
	getMe,
	enableTwoFactor,
	verifyTwoFactorTotp,
	disableTwoFactor,
	deleteAllAuthCookies
} = await import('./auth.server');

type Appel = { url: string; init?: RequestInit };

const appels: Appel[] = [];

function fetchQuiRepond(corps: unknown, status = 200, setCookie?: string) {
	return (async (url: string, init?: RequestInit) => {
		appels.push({ url: String(url), init });
		const headers = new Headers({ 'content-type': 'application/json' });
		if (setCookie) headers.append('set-cookie', setCookie);
		return new Response(JSON.stringify(corps), { status, headers });
	}) as unknown as typeof globalThis.fetch;
}

function fakeCookies(initiaux: Record<string, string> = {}) {
	const store = new Map(Object.entries(initiaux));
	const cookies = {
		getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
		set: (name: string, value: string) => store.set(name, value),
		delete: (name: string) => store.delete(name)
	};
	return { cookies: cookies as unknown as Cookies, noms: () => [...store.keys()] };
}

const dernier = () => appels[appels.length - 1];
const chemin = () => dernier().url.replace('http://api.test', '');
const corps = () => JSON.parse(String(dernier().init?.body ?? 'null'));

beforeEach(() => {
	appels.length = 0;
});

describe('signIn', () => {
	it('poste les identifiants sur la route Better-Auth', async () => {
		const { cookies } = fakeCookies();
		await signIn(fetchQuiRepond({ data: {} }), cookies, 'a@b.fr', 'motdepasse');

		expect(chemin()).toBe('/api/auth/sign-in/email');
		expect(corps()).toEqual({ email: 'a@b.fr', password: 'motdepasse' });
	});

	// Le corps de Better-Auth n'est pas dans l'enveloppe { message, data } : sans lecture du brut,
	// le drapeau 2FA est invisible et l'utilisateur est considéré comme pleinement connecté.
	it('signale qu’un défi 2FA reste à passer', async () => {
		const { cookies } = fakeCookies();
		const res = await signIn(
			fetchQuiRepond({ twoFactorRedirect: true }),
			cookies,
			'a@b.fr',
			'motdepasse'
		);
		expect(res.twoFactorRedirect).toBe(true);
	});

	it('ne réclame pas de second facteur sur une connexion simple', async () => {
		const { cookies } = fakeCookies();
		const res = await signIn(fetchQuiRepond({ data: {} }), cookies, 'a@b.fr', 'motdepasse');
		expect(res.twoFactorRedirect).toBe(false);
	});

	it('conserve le cookie émis par l’API — c’est lui qui porte le défi 2FA', async () => {
		const { cookies, noms } = fakeCookies();
		await signIn(
			fetchQuiRepond({ twoFactorRedirect: true }, 200, 'better-auth.two_factor=defi; Path=/'),
			cookies,
			'a@b.fr',
			'motdepasse'
		);
		expect(noms()).toContain('better-auth.two_factor');
	});

	it('remonte l’échec sans poser de cookie quand les identifiants sont refusés', async () => {
		const { cookies, noms } = fakeCookies();
		const res = await signIn(
			fetchQuiRepond({ message: 'Identifiants invalides.' }, 401, 'better-auth.session=x'),
			cookies,
			'a@b.fr',
			'mauvais'
		);

		expect(res).toMatchObject({ ok: false, status: 401 });
		expect(noms()).toEqual([]);
	});
});

describe('signUp', () => {
	it('transmet le jeton d’invitation avec l’inscription', async () => {
		const { cookies } = fakeCookies();
		await signUp(fetchQuiRepond({ data: {} }), cookies, 'Alice', 'a@b.fr', 'mdp', 'tok123');

		expect(chemin()).toBe('/api/auth/sign-up/email');
		expect(corps()).toMatchObject({ name: 'Alice', email: 'a@b.fr', token: 'tok123' });
	});

	it('ouvre la session dès l’inscription réussie', async () => {
		const { cookies, noms } = fakeCookies();
		await signUp(
			fetchQuiRepond({ data: {} }, 200, 'better-auth.session_token=jeton; Path=/'),
			cookies,
			'Alice',
			'a@b.fr',
			'mdp'
		);
		expect(noms()).toContain('better-auth.session_token');
	});
});

describe('signOut', () => {
	it('referme tout, y compris un défi 2FA resté en suspens', async () => {
		const { cookies, noms } = fakeCookies({
			'better-auth.session_token': 'jeton',
			'better-auth.two_factor': 'defi',
			langue: 'fr'
		});

		await signOut(fetchQuiRepond({ data: null }), cookies);

		expect(chemin()).toBe('/api/auth/sign-out');
		expect(noms()).toEqual(['langue']);
	});

	it('purge les cookies même si l’API de déconnexion échoue — sinon l’utilisateur reste « connecté »', async () => {
		const { cookies, noms } = fakeCookies({ 'better-auth.session_token': 'jeton' });
		await signOut(fetchQuiRepond({ message: 'Erreur' }, 500), cookies);
		expect(noms()).toEqual([]);
	});
});

describe('deleteAllAuthCookies', () => {
	it('ne touche pas aux cookies applicatifs', () => {
		const { cookies, noms } = fakeCookies({ 'better-auth.session_token': 'x', theme: 'sombre' });
		deleteAllAuthCookies(cookies);
		expect(noms()).toEqual(['theme']);
	});
});

describe('getMe', () => {
	it('interroge la route qui résume l’utilisateur, son organisation et son rôle', async () => {
		const { cookies } = fakeCookies();
		const res = await getMe(
			fetchQuiRepond({ data: { user: { id: 'u1' }, role: 'quality', activeOrgId: 'o1' } }),
			cookies
		);

		expect(chemin()).toBe('/api/me');
		expect(res.ok && res.data).toMatchObject({ role: 'quality', activeOrgId: 'o1' });
	});
});

describe('enrôlement et vérification 2FA', () => {
	it('expose l’URI du QR code et les codes de secours hors enveloppe', async () => {
		const { cookies } = fakeCookies();
		const res = await enableTwoFactor(
			fetchQuiRepond({ totpURI: 'otpauth://totp/NutriChain', backupCodes: ['a', 'b'] }),
			cookies,
			'mdp'
		);

		expect(chemin()).toBe('/api/auth/two-factor/enable');
		expect(res.payload).toEqual({
			totpURI: 'otpauth://totp/NutriChain',
			backupCodes: ['a', 'b']
		});
	});

	it('ne rend aucun secret quand le mot de passe est refusé', async () => {
		const { cookies } = fakeCookies();
		const res = await enableTwoFactor(
			fetchQuiRepond({ message: 'Mot de passe invalide.' }, 401),
			cookies,
			'mauvais'
		);
		expect(res.payload).toBeUndefined();
	});

	it('un code TOTP valide ouvre la session complète', async () => {
		const { cookies, noms } = fakeCookies({ 'better-auth.two_factor': 'defi' });
		await verifyTwoFactorTotp(
			fetchQuiRepond({ data: {} }, 200, 'better-auth.session_token=jeton; Path=/'),
			cookies,
			'123456'
		);

		expect(chemin()).toBe('/api/auth/two-factor/verify-totp');
		expect(noms()).toContain('better-auth.session_token');
	});

	it('un code TOTP refusé n’ouvre aucune session', async () => {
		const { cookies, noms } = fakeCookies({ 'better-auth.two_factor': 'defi' });
		const res = await verifyTwoFactorTotp(
			fetchQuiRepond({ message: 'Code invalide.' }, 401, 'better-auth.session_token=jeton'),
			cookies,
			'000000'
		);

		expect(res.ok).toBe(false);
		expect(noms()).not.toContain('better-auth.session_token');
	});

	it('la désactivation redemande le mot de passe', async () => {
		const { cookies } = fakeCookies();
		await disableTwoFactor(fetchQuiRepond({ data: null }), cookies, 'mdp');

		expect(chemin()).toBe('/api/auth/two-factor/disable');
		expect(corps()).toEqual({ password: 'mdp' });
	});
});

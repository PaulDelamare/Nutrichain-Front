import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

type FetchFn = typeof fetch;

type ClientOpts = {
	useApiKey?: boolean;
};

export type ApiOk<T> = {
	ok: true;
	status: number;
	message: string;
	data: T;
	/**
	 * Corps JSON brut de la réponse. Les routes du passthrough Better-Auth (sign-in, 2FA…) ne
	 * répondent pas dans notre enveloppe `{message, data}` — sans ce champ, un flag comme
	 * `twoFactorRedirect` est invisible : `data` vaudrait `undefined` (`payload.data` n'existe pas).
	 */
	raw?: unknown;
};

export type ApiErr = {
	ok: false;
	status: number;
	message: string;
};

export type ApiResult<T> = ApiOk<T> | ApiErr;

// Échec réseau (API down, DNS, timeout) : on dégrade en ApiErr au lieu de laisser
// le fetch rejeter — sinon chaque load/action SSR devient une page 500.
const UNREACHABLE: ApiErr = {
	ok: false,
	status: 503,
	message: 'API injoignable — réessayez plus tard.'
};

function baseUrl(): string {
	return (env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

function buildCookieHeader(cookies: Cookies): string {
	// Symétrique du décodage fait à la réception (`applySetCookies`) : `cookies.getAll()` renvoie la
	// valeur DÉCODÉE. L'API (Better-Auth) attend de retrouver la même forme encodée qu'elle avait
	// elle-même émise dans son Set-Cookie — sans ce ré-encodage, le cookie relayé au retour ne
	// correspond plus à celui vérifié côté API (401 « Invalid two factor cookie » sur le défi 2FA).
	return cookies
		.getAll()
		.map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
		.join('; ');
}

async function parseJson<T>(res: Response): Promise<ApiResult<T>> {
	let payload: { message?: string; data?: T; error?: { field: string; message: string }[] } = {};

	try {
		payload = await res.json();
	} catch {
		return { ok: false, status: res.status, message: res.statusText || 'Réponse invalide' };
	}

	if (res.ok) {
		return {
			ok: true,
			status: res.status,
			message: payload.message ?? 'OK',
			data: payload.data as T,
			raw: payload
		};
	}

	const msg = payload.error?.map((e) => e.message).join(' ') || payload.message || 'Erreur API';

	return { ok: false, status: res.status, message: msg };
}

export function applySetCookies(res: Response, cookies: Cookies) {
	const raw = res.headers.getSetCookie?.() ?? [];

	for (const line of raw) {
		const [pair, ...attrs] = line.split(';');
		const eq = pair.indexOf('=');
		if (eq === -1) continue;

		const name = pair.slice(0, eq).trim();
		// L'API renvoie déjà une valeur URL-encodée (Better-Auth encode ses cookies à l'émission).
		// `cookies.set` de SvelteKit encode À NOUVEAU sa valeur avant d'écrire l'en-tête : sans ce
		// décodage, la valeur repart doublement encodée (`%3D` → `%253D`), et le cookie relayé ne
		// correspond plus à celui attendu par l'API à la requête suivante (401 « Invalid two factor
		// cookie » constaté sur le défi 2FA — la session normale n'en souffrait pas visiblement,
		// mais la même corruption s'y appliquait).
		const rawValue = pair.slice(eq + 1).trim();
		// Un `%` non suivi d'un couple hexadécimal valide ferait planter `decodeURIComponent` (rare,
		// mais une valeur Better-Auth n'est pas censée en contenir) — on dégrade sur la valeur brute
		// plutôt que de faire échouer toute la requête pour un cookie mal formé.
		let value: string;
		try {
			value = decodeURIComponent(rawValue);
		} catch {
			value = rawValue;
		}
		const opts: Parameters<Cookies['set']>[2] = { path: '/' };

		for (const attr of attrs) {
			const [k, v] = attr.trim().split('=');
			const key = k.toLowerCase();

			if (key === 'httponly') opts.httpOnly = true;
			if (key === 'secure') opts.secure = true;
			if (key === 'path' && v) opts.path = v;
			if (key === 'max-age' && v) opts.maxAge = Number(v);
			if (key === 'samesite' && v) opts.sameSite = v.toLowerCase() as 'lax' | 'strict' | 'none';
		}

		cookies.set(name, value, opts);
	}
}

export class ApiClient {
	constructor(
		private fetch: FetchFn,
		private cookies?: Cookies,
		private opts: ClientOpts = {}
	) {}

	private url(path: string): string {
		return `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
	}

	private headers(extra?: Record<string, string>): Headers {
		const h = new Headers({ Accept: 'application/json', ...extra });

		if (this.opts.useApiKey !== false && env.API_KEY) {
			h.set('x-api-key', env.API_KEY);
		}

		if (this.cookies) {
			const cookie = buildCookieHeader(this.cookies);
			if (cookie) h.set('Cookie', cookie);
		}

		return h;
	}

	get<T>(path: string): Promise<ApiResult<T>> {
		return this.fetch(this.url(path), { headers: this.headers() })
			.then(parseJson<T>)
			.catch(() => UNREACHABLE);
	}

	async post<T>(
		path: string,
		body?: unknown
	): Promise<(ApiOk<T> & { response: Response }) | (ApiErr & { response?: Response })> {
		return this.write<T>('POST', path, body);
	}

	patch<T>(
		path: string,
		body?: unknown
	): Promise<(ApiOk<T> & { response: Response }) | (ApiErr & { response?: Response })> {
		return this.write<T>('PATCH', path, body);
	}

	// Corps texte brut (ex. import CSV : l'API attend text/csv, pas du JSON).
	async postText<T>(path: string, text: string, contentType = 'text/csv'): Promise<ApiResult<T>> {
		try {
			const res = await this.fetch(this.url(path), {
				method: 'POST',
				headers: this.headers({ 'Content-Type': contentType }),
				body: text
			});
			return parseJson<T>(res);
		} catch {
			return UNREACHABLE;
		}
	}

	private async write<T>(
		method: 'POST' | 'PATCH',
		path: string,
		body?: unknown
	): Promise<(ApiOk<T> & { response: Response }) | (ApiErr & { response?: Response })> {
		try {
			const res = await this.fetch(this.url(path), {
				method,
				headers: this.headers({ 'Content-Type': 'application/json' }),
				body: body ? JSON.stringify(body) : undefined
			});

			const parsed = await parseJson<T>(res);
			return { ...parsed, response: res };
		} catch {
			return { ...UNREACHABLE };
		}
	}
}

export function api(fetch: FetchFn, cookies?: Cookies, opts?: ClientOpts) {
	return new ApiClient(fetch, cookies, opts);
}

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
};

export type ApiErr = {
	ok: false;
	status: number;
	message: string;
};

export type ApiResult<T> = ApiOk<T> | ApiErr;

const UNREACHABLE: ApiErr = {
	ok: false,
	status: 503,
	message: 'API injoignable — réessayez plus tard.'
};

function baseUrl(): string {
	return (env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

function buildCookieHeader(cookies: Cookies): string {
	return cookies
		.getAll()
		.map((c) => `${c.name}=${c.value}`)
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
			data: payload.data as T
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
		const value = pair.slice(eq + 1).trim();
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

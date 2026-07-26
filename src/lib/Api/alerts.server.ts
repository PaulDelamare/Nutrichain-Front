import type { Cookies } from '@sveltejs/kit';
import { api } from './client.server';
import type { ApiAlert } from './organization.server';

/** Clôture une alerte (froid, rappel, …) — auth session, rôles qualité côté API. */
export function resolveAlert(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	alertId: string,
	note?: string
) {
	const trimmed = note?.trim();
	return api(fetch, cookies, { useApiKey: false }).patch<{ alert: ApiAlert }>(
		`/api/alerts/${encodeURIComponent(alertId)}/resolve`,
		trimmed ? { note: trimmed } : {}
	);
}

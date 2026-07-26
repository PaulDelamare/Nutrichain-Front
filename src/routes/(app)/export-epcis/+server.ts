import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exportEpcisEventsCsv } from '$lib/Api/connectors.server';

/** Téléchargement CSV EPCIS — GET /api/connectors/exports/events. */
export const GET: RequestHandler = async ({ fetch, cookies, locals }) => {
	if (!locals.user) error(401, 'Connexion requise.');

	const res = await exportEpcisEventsCsv(fetch, cookies);
	if (!res.ok) error(res.message.includes('injoignable') ? 503 : 403, res.message);

	return new Response(res.csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="epcis-events.csv"'
		}
	});
};

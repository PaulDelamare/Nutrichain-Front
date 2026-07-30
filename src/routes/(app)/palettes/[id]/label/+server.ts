import { error } from '@sveltejs/kit';
import { fetchLogisticUnitLabel } from '$lib/Api/logistics.server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, cookies, params }) => {
	const res = await fetchLogisticUnitLabel(fetch, cookies, params.id);

	if (!res.ok) {
		error(res.message.includes('introuvable') ? 404 : 502, res.message);
	}

	return new Response(res.buffer, {
		headers: {
			'Content-Type': 'image/png',
			'Content-Disposition': `inline; filename="etiquette-palette-${params.id}.png"`
		}
	});
};

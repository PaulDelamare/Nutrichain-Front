import { error } from '@sveltejs/kit';
import { fetchBatchLabel } from '$lib/Api/logistics.server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, cookies, params }) => {
	const res = await fetchBatchLabel(fetch, cookies, params.lotId);

	if (!res.ok) {
		error(res.message.includes('introuvable') ? 404 : 502, res.message);
	}

	return new Response(res.buffer, {
		headers: {
			'Content-Type': 'image/png',
			'Content-Disposition': `inline; filename="label-${params.lotId}.png"`
		}
	});
};

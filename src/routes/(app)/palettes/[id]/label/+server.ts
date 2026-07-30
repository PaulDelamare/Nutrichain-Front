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
			'Content-Disposition': `inline; filename="etiquette-palette-${params.id}.png"`,
			// L'API sert cette image en cache PRIVE : elle porte le SSCC ou le numero de lot d'une
			// organisation. La reponse etant reconstruite ici, l'en-tete doit etre repose — sinon un
			// cache partage peut la resservir a un appelant sans session.
			'Cache-Control': 'private, max-age=300'
		}
	});
};

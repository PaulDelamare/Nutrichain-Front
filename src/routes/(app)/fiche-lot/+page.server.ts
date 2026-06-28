import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Pas de page liste — accès uniquement via /fiche-lot/[lotId] depuis la recherche. */
export const load: PageServerLoad = ({ url }) => {
	const lot = url.searchParams.get('lot');
	if (lot) {
		redirect(301, `/fiche-lot/${encodeURIComponent(lot)}`);
	}
	redirect(302, '/recherche-lots');
};

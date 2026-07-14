import type { PageServerLoad } from './$types';
import { getPublicScan } from '$lib/Api/public.server';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const res = await getPublicScan(fetch, params.id);

	if (!res.ok) {
		return { scan: null, error: res.message };
	}

	return { scan: res.data, error: null };
};

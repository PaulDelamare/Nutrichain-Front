import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getAlerts } from '$lib/Api/organization.server';
import { countActiveColdAlerts } from '$lib/utils/org/mappers';
import { safeRedirect } from '$lib/utils/safeRedirect';

export const load: LayoutServerLoad = async ({ locals, url, fetch, cookies, depends }) => {
	if (!locals.user) {
		redirect(303, `/connexion?redirect=${encodeURIComponent(safeRedirect(url.pathname, '/tableau-de-bord'))}`);
	}

	if (locals.user.isPlatformAdmin) {
		redirect(303, '/plateforme');
	}

	void url.pathname;
	depends('nutrichain:alerts');

	const alerts = await getAlerts(fetch, cookies);

	return {
		user: locals.user,
		coldAlerts: alerts.ok ? countActiveColdAlerts(alerts.data) : null
	};
};

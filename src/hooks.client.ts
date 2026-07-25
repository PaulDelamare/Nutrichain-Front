import type { HandleClientError } from '@sveltejs/kit';
import { initWebVitals } from '$lib/monitoring/webVitals';

// Monitoring de performance (Core Web Vitals) — démarré une seule fois au boot du client.
initWebVitals();

export const handleError: HandleClientError = ({ error, event }) => {
	console.error('Erreur client', event.url.pathname, error);
	return { message: 'Une erreur inattendue est survenue.' };
};

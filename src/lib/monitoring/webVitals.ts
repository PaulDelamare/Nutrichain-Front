import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Endpoint optionnel de collecte des métriques (ex. `/api/vitals` ou un service tiers).
 * S'il est absent, les métriques sont simplement affichées en console en développement.
 */
const endpoint = env.PUBLIC_VITALS_ENDPOINT;

function report(metric: Metric) {
	if (dev) {
		// Lisible pendant le développement : nom, valeur arrondie et note (good / needs / poor).
		console.info(`[web-vitals] ${metric.name} = ${Math.round(metric.value)} (${metric.rating})`);
	}

	if (!endpoint) return;

	const body = JSON.stringify({
		name: metric.name,
		value: metric.value,
		rating: metric.rating,
		id: metric.id,
		navigationType: metric.navigationType,
		path: location.pathname
	});

	// sendBeacon survit au déchargement de la page ; fallback fetch keepalive si indisponible.
	if (navigator.sendBeacon) {
		navigator.sendBeacon(endpoint, body);
	} else {
		void fetch(endpoint, { method: 'POST', body, keepalive: true });
	}
}

let started = false;

/** Branche les observers Core Web Vitals (idempotent). À appeler une fois côté client. */
export function initWebVitals() {
	if (started || typeof globalThis.window === 'undefined') return;
	started = true;

	onCLS(report);
	onINP(report);
	onLCP(report);
	onFCP(report);
	onTTFB(report);
}

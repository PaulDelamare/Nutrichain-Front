import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

const endpoint = env.PUBLIC_VITALS_ENDPOINT;

function report(metric: Metric) {
	if (dev) {
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

	if (navigator.sendBeacon) {
		navigator.sendBeacon(endpoint, body);
	} else {
		void fetch(endpoint, { method: 'POST', body, keepalive: true });
	}
}

let started = false;

export function initWebVitals() {
	if (started || typeof globalThis.window === 'undefined') return;
	started = true;

	onCLS(report);
	onINP(report);
	onLCP(report);
	onFCP(report);
	onTTFB(report);
}

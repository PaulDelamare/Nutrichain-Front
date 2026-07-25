import { describe, it, expect, vi, beforeEach } from 'vitest';

const abonnements: string[] = [];
const abonne = (nom: string) => (cb: (m: unknown) => void) => {
	abonnements.push(nom);
	rapporte = cb;
};
let rapporte: ((m: unknown) => void) | undefined;

vi.mock('$app/environment', () => ({ dev: false }));
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_VITALS_ENDPOINT: 'https://collecte.test/vitals' }
}));
vi.mock('web-vitals', () => ({
	onCLS: abonne('CLS'),
	onINP: abonne('INP'),
	onLCP: abonne('LCP'),
	onFCP: abonne('FCP'),
	onTTFB: abonne('TTFB')
}));

const { initWebVitals } = await import('./webVitals');

const metrique = {
	name: 'LCP',
	value: 2345.6,
	rating: 'needs-improvement',
	id: 'v4-1',
	navigationType: 'navigate'
};

describe('initWebVitals', () => {
	beforeEach(() => {
		abonnements.length = 0;
		vi.unstubAllGlobals();
	});

	it('mesure les cinq indicateurs Core Web Vitals', () => {
		vi.stubGlobal('window', {});
		initWebVitals();
		expect(abonnements).toEqual(['CLS', 'INP', 'LCP', 'FCP', 'TTFB']);
	});

	// Le module est importé par le layout, y compris pendant le rendu serveur.
	it('ne s’abonne qu’une fois, même si le layout se remonte', () => {
		vi.stubGlobal('window', {});
		initWebVitals();
		expect(abonnements).toEqual([]);
	});

	it('envoie la mesure en beacon pour ne pas retarder la navigation', () => {
		const sendBeacon = vi.fn();
		vi.stubGlobal('navigator', { sendBeacon });
		vi.stubGlobal('location', { pathname: '/tableau-de-bord' });

		rapporte?.(metrique);

		expect(sendBeacon).toHaveBeenCalledWith(
			'https://collecte.test/vitals',
			JSON.stringify({ ...metrique, path: '/tableau-de-bord' })
		);
	});

	it('retombe sur fetch quand le navigateur ne sait pas envoyer de beacon', () => {
		const fetch = vi.fn();
		vi.stubGlobal('navigator', {});
		vi.stubGlobal('location', { pathname: '/' });
		vi.stubGlobal('fetch', fetch);

		rapporte?.(metrique);

		expect(fetch).toHaveBeenCalledWith(
			'https://collecte.test/vitals',
			expect.objectContaining({ method: 'POST', keepalive: true })
		);
	});
});

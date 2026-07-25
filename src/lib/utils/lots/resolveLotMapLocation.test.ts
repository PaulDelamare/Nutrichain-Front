import { describe, it, expect } from 'vitest';
import { resolveLotMapLocation, defaultZoomForPin } from './resolveLotMapLocation';

describe('resolveLotMapLocation', () => {
	it('n’affiche aucun pin quand le lot n’a ni coordonnées ni site', () => {
		expect(resolveLotMapLocation(null, null)).toBeNull();
		expect(resolveLotMapLocation('—', '—')).toBeNull();
	});

	it('marque « précis » uniquement les coordonnées réellement fournies par l’API', () => {
		const pin = resolveLotMapLocation('Usine Loire', 'Cuve 3', { lat: 47.21, lng: -1.55 });
		expect(pin).toMatchObject({ lat: 47.21, lng: -1.55, precise: true, sublabel: 'Cuve 3' });
	});

	it('ne se dit jamais précis quand la position est déduite du nom du site', () => {
		const pin = resolveLotMapLocation('Usine Loire');
		expect(pin?.precise).toBe(false);
	});

	it('centre sur la France quand le site n’est reconnu par aucun repère', () => {
		const pin = resolveLotMapLocation('Site inconnu');
		expect(pin).toMatchObject({ lat: 47, lng: 2, precise: false });
	});

	it('une latitude seule ne suffit pas à revendiquer une position précise', () => {
		const pin = resolveLotMapLocation('Site inconnu', null, { lat: 47.21, lng: null });
		expect(pin?.precise).toBe(false);
	});

	it('nomme le pin « Emplacement du lot » quand seules les coordonnées sont connues', () => {
		const pin = resolveLotMapLocation(null, null, { lat: 1, lng: 2 });
		expect(pin?.label).toBe('Emplacement du lot');
	});
});

describe('defaultZoomForPin', () => {
	it('dézoome sur la France pour une position approximative', () => {
		expect(defaultZoomForPin({ lat: 47, lng: 2, label: 'Site inconnu', precise: false })).toBe(6);
	});

	it('zoome sur la ville quand le repère du site est connu', () => {
		expect(defaultZoomForPin({ lat: 48.11, lng: -1.67, label: 'Rennes', precise: true })).toBe(13);
	});

	it('garde un zoom ville par défaut pour une position précise hors référentiel', () => {
		expect(defaultZoomForPin({ lat: 43.6, lng: 1.44, label: 'Toulouse', precise: true })).toBe(12);
	});
});

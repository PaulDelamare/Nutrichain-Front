import { describe, it, expect } from 'vitest';
import { parseCoordinates, parseCoordinateFields, formatCoordinates } from './coordinates';

describe('parseCoordinates', () => {
	// L'API sert des colonnes DECIMAL : en JSON, ce sont des CHAÎNES ("48.832910"), comme les
	// températures. Les traiter comme des nombres directement donnait `NaN` sur la carte.
	it('lit les décimaux servis en chaîne par l’API', () => {
		expect(parseCoordinates('48.832910', '2.286540')).toEqual({ lat: 48.83291, lng: 2.28654 });
	});

	it('lit aussi des nombres', () => {
		expect(parseCoordinates(48.83291, 2.28654)).toEqual({ lat: 48.83291, lng: 2.28654 });
	});

	it('accepte le méridien et l’équateur (0 n’est pas une absence de position)', () => {
		expect(parseCoordinates(0, 0)).toEqual({ lat: 0, lng: 0 });
	});

	it('rend null sur une position absente', () => {
		expect(parseCoordinates(null, null)).toBeNull();
		expect(parseCoordinates(undefined, undefined)).toBeNull();
		expect(parseCoordinates('', '')).toBeNull();
	});

	it('rend null sur une demi-position', () => {
		expect(parseCoordinates(48.83291, null)).toBeNull();
		expect(parseCoordinates(null, 2.28654)).toBeNull();
	});

	it('rend null hors bornes terrestres — typiquement lat/lng permutées', () => {
		expect(parseCoordinates(122.4, 37.77)).toBeNull();
		expect(parseCoordinates(48.83291, 180.5)).toBeNull();
	});

	it('rend null sur une valeur non numérique', () => {
		expect(parseCoordinates('nord', 'est')).toBeNull();
		expect(parseCoordinates(Number.NaN, 2.28654)).toBeNull();
	});
});

describe('parseCoordinateFields', () => {
	it('accepte un couple complet', () => {
		expect(parseCoordinateFields('48.832910', '2.286540')).toEqual({
			ok: true,
			latitude: 48.83291,
			longitude: 2.28654
		});
	});

	it('lit deux champs vides comme un retrait de position', () => {
		expect(parseCoordinateFields('', '')).toEqual({ ok: true, latitude: null, longitude: null });
		expect(parseCoordinateFields('  ', '  ')).toEqual({
			ok: true,
			latitude: null,
			longitude: null
		});
	});

	it('nomme l’erreur quand une seule des deux coordonnées est saisie', () => {
		const res = parseCoordinateFields('48.832910', '');

		expect(res.ok).toBe(false);
		expect(res.ok === false && res.message).toMatch(/latitude et longitude/i);
	});

	it('nomme l’erreur quand les coordonnées sortent des bornes', () => {
		const res = parseCoordinateFields('122.4', '37.77');

		expect(res.ok).toBe(false);
		expect(res.ok === false && res.message).toMatch(/-90 et 90/);
	});
});

describe('formatCoordinates', () => {
	it('affiche un couple à 4 décimales, relisible par un humain', () => {
		expect(formatCoordinates('48.832910', '2.286540')).toBe('48.8329, 2.2865');
	});

	it('rend null quand le lieu n’est pas positionné', () => {
		expect(formatCoordinates(null, null)).toBeNull();
		expect(formatCoordinates('48.832910', null)).toBeNull();
	});
});

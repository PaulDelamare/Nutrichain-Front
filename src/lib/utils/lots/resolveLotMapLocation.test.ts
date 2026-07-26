import { describe, it, expect } from 'vitest';
import { resolveLotMapLocation, LOT_MAP_ZOOM } from './resolveLotMapLocation';

describe('resolveLotMapLocation', () => {
	it('place le repère sur les coordonnées saisies de l’emplacement', () => {
		const pin = resolveLotMapLocation('Chambre froide A', 'Groupe 1', {
			latitude: '48.833180',
			longitude: '2.286910'
		});

		expect(pin).toEqual({
			lat: 48.83318,
			lng: 2.28691,
			label: 'Chambre froide A',
			sublabel: 'Groupe 1'
		});
	});

	/**
	 * ⚠️ Le cœur de #23 : cette fonction DÉDUISAIT la position du nom du site (« Loire » → pin de
	 * Nantes) et, à défaut, repliait sur le centre de la France. Un nom de lieu ne dit rien de sa
	 * position : sans coordonnées, il n'y a pas de repère.
	 */
	it('ne déduit AUCUNE position du nom du site', () => {
		expect(resolveLotMapLocation('Usine Loire', 'Cuve 3')).toBeNull();
		expect(resolveLotMapLocation('Entrepôt de Rennes', 'Quai 2')).toBeNull();
		expect(resolveLotMapLocation('Plateforme Paris Sud')).toBeNull();
	});

	it('ne se replie pas sur le centre de la France quand le lieu n’est pas positionné', () => {
		expect(resolveLotMapLocation('Quai de réception', 'Rack A', {})).toBeNull();
		expect(
			resolveLotMapLocation('Quai de réception', 'Rack A', { latitude: null, longitude: null })
		).toBeNull();
	});

	it('refuse une demi-position : une latitude seule ne place rien', () => {
		expect(resolveLotMapLocation('Quai', null, { latitude: 48.83291 })).toBeNull();
		expect(resolveLotMapLocation('Quai', null, { longitude: 2.28654 })).toBeNull();
	});

	it('ignore des coordonnées hors du domaine terrestre plutôt que de les afficher', () => {
		expect(resolveLotMapLocation('Quai', null, { latitude: 122.4, longitude: 37.77 })).toBeNull();
		expect(resolveLotMapLocation('Quai', null, { latitude: 48.8, longitude: 361 })).toBeNull();
		expect(resolveLotMapLocation('Quai', null, { latitude: 'nord', longitude: 'est' })).toBeNull();
	});

	it('nomme le repère « Emplacement du lot » quand le lieu n’a pas de nom lisible', () => {
		const pin = resolveLotMapLocation('—', '—', { latitude: 48.83291, longitude: 2.28654 });

		expect(pin?.label).toBe('Emplacement du lot');
		expect(pin?.sublabel).toBeUndefined();
	});

	it('zoome à l’échelle d’un plan d’usine, pas d’une région', () => {
		expect(LOT_MAP_ZOOM).toBeGreaterThanOrEqual(15);
	});
});

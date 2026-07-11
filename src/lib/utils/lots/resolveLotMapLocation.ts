import type { LotMapPin } from '$lib/types/lot-map';

/** Référentiel provisoire — remplacé par lat/lng en base (Location) plus tard. */
const SITE_COORDINATES: { match: RegExp; lat: number; lng: number; zoom: number }[] = [
	{ match: /rennes|bretagne/i, lat: 48.1173, lng: -1.6778, zoom: 13 },
	{ match: /loire|nantes|stef/i, lat: 47.2184, lng: -1.5536, zoom: 12 },
	{ match: /paris|ile-de-france|île-de-france/i, lat: 48.8566, lng: 2.3522, zoom: 11 },
	{ match: /lyon|rhône|rhone/i, lat: 45.764, lng: 4.8357, zoom: 12 }
];

const DEFAULT_CENTER = { lat: 47.0, lng: 2.0, zoom: 6 };

function matchSite(site: string) {
	return SITE_COORDINATES.find(({ match }) => match.test(site));
}

/**
 * Dérive une position carte à partir du site / zone équipement.
 * Accepte plus tard des coordonnées explicites depuis l'API.
 */
export function resolveLotMapLocation(
	site?: string | null,
	zone?: string | null,
	coords?: { lat?: number | null; lng?: number | null } | null
): LotMapPin | null {
	const label = site && site !== '—' ? site : null;
	const sublabel = zone && zone !== '—' ? zone : undefined;

	if (coords?.lat != null && coords?.lng != null) {
		return {
			lat: coords.lat,
			lng: coords.lng,
			label: label ?? 'Emplacement du lot',
			sublabel,
			precise: true
		};
	}

	if (!label) return null;

	const hit = matchSite(label);
	if (hit) {
		return {
			lat: hit.lat,
			lng: hit.lng,
			label,
			sublabel,
			precise: true
		};
	}

	return {
		lat: DEFAULT_CENTER.lat,
		lng: DEFAULT_CENTER.lng,
		label,
		sublabel,
		precise: false
	};
}

export function defaultZoomForPin(pin: LotMapPin): number {
	if (!pin.precise) return DEFAULT_CENTER.zoom;
	const hit = SITE_COORDINATES.find(({ match }) => match.test(pin.label));
	return hit?.zoom ?? 12;
}

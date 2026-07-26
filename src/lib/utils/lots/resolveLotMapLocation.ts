import type { LotMapPin } from '$lib/types/lot-map';
import { parseCoordinates, type RawCoordinate } from '$lib/utils/geo/coordinates';

/**
 * Zoom d'un plan d'usine : les coordonnées d'un emplacement désignent un bâtiment, pas une région.
 */
export const LOT_MAP_ZOOM = 17;

type LieuCoordinates = {
	latitude?: RawCoordinate;
	longitude?: RawCoordinate;
};

/**
 * Position du lot sur la carte — UNIQUEMENT à partir des coordonnées saisies sur son emplacement.
 *
 * Cette fonction devinait la position par regex sur le NOM du site (« Loire » → pin de Nantes) et,
 * à défaut, repliait sur le centre de la France ; le repère s'affichait sous une bannière « données
 * en direct depuis la base » (#23). Un emplacement non positionné ne rend plus aucun repère : la
 * fiche lot affiche alors son état vide, ce qui est la seule réponse vraie.
 */
export function resolveLotMapLocation(
	site?: string | null,
	zone?: string | null,
	lieu?: LieuCoordinates | null
): LotMapPin | null {
	const coords = parseCoordinates(lieu?.latitude, lieu?.longitude);
	if (!coords) return null;

	return {
		lat: coords.lat,
		lng: coords.lng,
		label: site && site !== '—' ? site : 'Emplacement du lot',
		sublabel: zone && zone !== '—' ? zone : undefined
	};
}

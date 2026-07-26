/**
 * Coordonnées géographiques — lecture, saisie, affichage.
 *
 * L'API sert `latitude`/`longitude` en DECIMAL, donc en CHAÎNE dans le JSON (`"48.832910"`), comme
 * les températures. Tout ce qui n'est pas un point du domaine terrestre est traité comme absent :
 * mieux vaut aucune carte qu'un repère posé à côté de la vérité (cf. #23).
 */

const LAT_MAX = 90;
const LNG_MAX = 180;

export type RawCoordinate = string | number | null | undefined;

export type Coordinates = { lat: number; lng: number };

function toNumberInRange(value: RawCoordinate, limit: number): number | null {
	if (value === null || value === undefined || value === '') return null;

	const n = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(n) || Math.abs(n) > limit) return null;

	return n;
}

/**
 * Le couple, ou rien : une latitude sans longitude ne place aucun repère sur une carte.
 */
export function parseCoordinates(
	latitude: RawCoordinate,
	longitude: RawCoordinate
): Coordinates | null {
	const lat = toNumberInRange(latitude, LAT_MAX);
	const lng = toNumberInRange(longitude, LNG_MAX);
	if (lat === null || lng === null) return null;

	return { lat, lng };
}

export type CoordinateFields =
	| { ok: true; latitude: number | null; longitude: number | null }
	| { ok: false; message: string };

/**
 * Lit le couple d'un formulaire. Deux champs vides = retirer la position (les deux `null`), ce qui
 * est la seule façon de corriger une saisie fausse sans passer par la base. Toute autre combinaison
 * incomplète est refusée ici plutôt qu'en 400 de l'API, pour nommer l'erreur à l'utilisateur.
 */
export function parseCoordinateFields(latitude: string, longitude: string): CoordinateFields {
	const lat = latitude.trim();
	const lng = longitude.trim();

	if (lat === '' && lng === '') return { ok: true, latitude: null, longitude: null };
	if (lat === '' || lng === '') {
		return {
			ok: false,
			message: 'Latitude ET longitude sont nécessaires : une seule ne place aucun repère.'
		};
	}

	const coords = parseCoordinates(lat, lng);
	if (!coords) {
		return {
			ok: false,
			message:
				'Coordonnées invalides : latitude entre -90 et 90, longitude entre -180 et 180 (degrés décimaux).'
		};
	}

	return { ok: true, latitude: coords.lat, longitude: coords.lng };
}

/**
 * Affichage court, 4 décimales — environ 11 m, la résolution utile pour relire une saisie.
 * `null` quand le lieu n'est pas positionné : l'appelant dit alors « sans position ».
 */
export function formatCoordinates(
	latitude: RawCoordinate,
	longitude: RawCoordinate
): string | null {
	const coords = parseCoordinates(latitude, longitude);
	if (!coords) return null;

	return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
}

/**
 * Position affichée sur la carte. Un pin n'existe que sur des coordonnées SAISIES sur l'emplacement
 * (cf. #23) : il n'y a donc plus de repère « approximatif » à distinguer, et l'absence de position
 * se dit par `null` plutôt que par un point de repli.
 */
export type LotMapPin = {
	lat: number;
	lng: number;
	label: string;
	sublabel?: string;
};

export type LotMapOptions = {
	zoom?: number;
	minHeight?: string;
};

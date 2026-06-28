/** Position affichée sur la carte — prête pour GPS / WMS futur. */
export type LotMapPin = {
	lat: number;
	lng: number;
	label: string;
	sublabel?: string;
	/** true = coordonnées connues (site ou API), false = repli géographique */
	precise: boolean;
};

export type LotMapOptions = {
	zoom?: number;
	minHeight?: string;
};

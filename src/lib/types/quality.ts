/** Lot qui attend son contrôle de sortie d'usine : il ne peut ni être expédié ni transformé. */
export type PendingQcLot = {
	id: string;
	lot: string;
	produit: string;
	quantite: string;
	depuis: string;
};

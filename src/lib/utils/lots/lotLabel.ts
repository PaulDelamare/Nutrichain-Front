/** Ce dont on a besoin pour nommer un lot — pas plus, pour rester utilisable partout. */
type LotNommable = {
	id: string;
	lot_number?: string | null;
	statut?: string;
	produit?: { nom: string } | null;
};

/**
 * Le numéro qu'un opérateur lit sur l'étiquette, ou un repli court quand le lot n'en porte pas.
 *
 * Cette règle était recopiée dans cinq écrans (recherche, traçabilité, transformations, expéditions,
 * rappels) et OUBLIÉE dans un sixième — la simulation de rappel, qui affichait donc des UUID bruts
 * (#80). Un opérateur arrive avec `260726-IXWL0H` en main, celui du code-barres : c'est ce
 * vocabulaire-là qui doit apparaître, jamais l'identifiant technique.
 *
 * Elle est centralisée parce qu'elle est COUPLÉE : le jour où la troncature passe de 8 caractères à
 * autre chose, les six écrans doivent changer ensemble ou se contredire.
 */
export function numeroLot(lot: LotNommable): string {
	return lot.lot_number ?? lot.id.slice(0, 8);
}

/**
 * Libellé d'un lot dans les deux écrans de RAPPEL — déclenchement et simulation.
 *
 * Ces deux-là partagent le même geste (choisir le lot à rappeler) et doivent donc proposer la même
 * lecture : sans ça, l'opérateur simule sur une liste et déclenche sur une autre. Les écrans de
 * transformation et d'expédition gardent volontairement leur propre format — ils montrent la
 * quantité disponible, qui ne sert à rien ici.
 */
export function libelleLotRappel(lot: LotNommable): string {
	return `${lot.produit?.nom ?? 'Produit'} — ${numeroLot(lot)} (${lot.statut ?? '—'})`;
}

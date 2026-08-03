// Filtres de colonnes du listing du matériel (Configuration), filtrés côté API. `tous` est la
// sentinelle « pas de filtre » du select de type. Le matériel ne s'archive pas : pas de statut ici.
export type EquipmentFilters = {
	nom: string;
	type: string;
};

export const emptyEquipmentFilters = (): EquipmentFilters => ({
	nom: '',
	type: 'tous'
});

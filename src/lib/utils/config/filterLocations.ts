import type { ApiLocation } from '$lib/Api/organization.server';
import type { LocationFilters } from '$lib/types/location';
import { matchOption, matchText } from '$lib/utils/filters/matchText';

/**
 * Filtre client des emplacements (référentiel borné : la pagination reste côté front). Nom en texte
 * (seuil 3 caractères), Type en select, Statut sur `is_active`.
 */
export function filterLocations(locations: ApiLocation[], f: LocationFilters): ApiLocation[] {
	return locations.filter((l) => {
		if (!matchText(l.nom, f.nom)) return false;
		if (!matchOption(l.type ?? '', f.type)) return false;
		if (f.statut === 'actif' && !l.is_active) return false;
		if (f.statut === 'archive' && l.is_active) return false;
		return true;
	});
}

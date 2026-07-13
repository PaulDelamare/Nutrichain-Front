import type { ApiQualityControl } from '$lib/Api/organization.server';

// L'API stocke `resultat` en texte libre : le seed écrit « NON_CONFORME — QUARANTAINE ».
// Sans normalisation, une non-conformité s'affiche en gris neutre, avec son code brut.
export function normalizeQualityResult(resultat: string): string {
	const r = resultat.toUpperCase();
	if (r.startsWith('NON_CONFORME')) return 'NON_CONFORME';
	if (r.startsWith('EN_COURS')) return 'EN_COURS';
	if (r.startsWith('CONFORME')) return 'CONFORME';
	return r;
}

/** Contrôles qui demandent une action. Un contrôle conforme n'est pas une anomalie. */
export function openQualityIssues(rows: ApiQualityControl[]): ApiQualityControl[] {
	return rows.filter((q) => normalizeQualityResult(q.resultat) !== 'CONFORME');
}

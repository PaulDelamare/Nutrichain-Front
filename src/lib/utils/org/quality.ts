import type { ApiQualityControl } from '$lib/Api/organization.server';

export function normalizeQualityResult(resultat: string): string {
	const r = resultat.toUpperCase();
	if (r.startsWith('NON_CONFORME')) return 'NON_CONFORME';
	if (r.startsWith('EN_COURS')) return 'EN_COURS';
	if (r.startsWith('CONFORME')) return 'CONFORME';
	return r;
}

export function openQualityIssues(rows: ApiQualityControl[]): ApiQualityControl[] {
	return rows.filter((q) => normalizeQualityResult(q.resultat) !== 'CONFORME');
}

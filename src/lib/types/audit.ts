// Filtres de colonnes du journal d'audit. `tous` est la sentinelle « pas de filtre » des selects ;
// `from`/`to` sont des valeurs `datetime-local` (`YYYY-MM-DDTHH:mm`) ou vides.
export type AuditFilters = {
	action: string;
	entity: string;
	entityId: string;
	from: string;
	to: string;
};

export const emptyAuditFilters = (): AuditFilters => ({
	action: 'tous',
	entity: 'tous',
	entityId: '',
	from: '',
	to: ''
});

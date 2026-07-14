export const MOVEMENT_CHART_TYPES = [
	'RECEPTION',
	'EXPEDITION',
	'QUARANTAINE',
	'TRANSFORMATION',
	'AUTRE'
] as const;

export type MovementChartType = (typeof MOVEMENT_CHART_TYPES)[number];

export function normalizeMovementType(type: string): MovementChartType {
	const t = type.toUpperCase();
	if (t.includes('RECEPTION')) return 'RECEPTION';
	if (t === 'EXPEDITION') return 'EXPEDITION';
	if (t.includes('QUARANTAINE') || t.includes('QUARANT') || t === 'QUARANTAINE_FROID')
		return 'QUARANTAINE';
	if (
		t.startsWith('TRANSFORMATION') ||
		t === 'TRANSFORM_CONSUME' ||
		t === 'TRANSFORM_CREATE' ||
		t === 'TRANSFORMATION'
	)
		return 'TRANSFORMATION';
	return 'AUTRE';
}

export const MOVEMENT_CHART_LABELS: Record<MovementChartType, string> = {
	RECEPTION: 'Réceptions',
	EXPEDITION: 'Expéditions',
	QUARANTAINE: 'Quarantaines',
	TRANSFORMATION: 'Transformations',
	AUTRE: 'Autres'
};

export const MOVEMENT_CHART_COLORS: Record<MovementChartType, string> = {
	RECEPTION: '#1b6b5c',
	EXPEDITION: '#5aafa0',
	QUARANTAINE: '#f59e0b',
	TRANSFORMATION: '#8fd4c5',
	AUTRE: '#94a3b8'
};

export const MOVEMENT_EVENT_LABELS: Record<string, string> = {
	RECEPTION: 'ObjectEvent — réception',
	EXPEDITION: 'TransactionEvent — expédition',
	QUARANTAINE: 'ObjectEvent — quarantaine',
	QUARANTAINE_FROID: 'ObjectEvent — quarantaine froid',
	TRANSFORMATION: 'TransformationEvent — production',
	TRANSFORMATION_ENTREE: 'TransformationEvent — production',
	TRANSFORMATION_SORTIE: 'TransformationEvent — consommation',
	CONTROLE_QUALITE: 'ObjectEvent — contrôle qualité',
	LEVEE_QUARANTAINE: 'ObjectEvent — levée de quarantaine',
	RAPPEL: 'TransactionEvent — rappel produit'
};

export function movementEventLabel(type: string): string {
	return MOVEMENT_EVENT_LABELS[type] ?? `ObjectEvent — ${type}`;
}

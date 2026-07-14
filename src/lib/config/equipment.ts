// Miroir de EQUIPMENT_TYPES côté API (equipment.schema.ts). Le type pilote la surveillance IoT :
// un frigo ou un congélateur a un seuil de température, pas une étagère.
export const EQUIPMENT_TYPE_OPTIONS = [
	{ value: 'FRIGO', label: 'Réfrigérateur' },
	{ value: 'CONGELATEUR', label: 'Congélateur' },
	{ value: 'CUVE', label: 'Cuve' },
	{ value: 'ETAGERE', label: 'Étagère' },
	{ value: 'MIXEUR', label: 'Mixeur' }
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPE_OPTIONS)[number]['value'];

export const EQUIPMENT_TYPES: EquipmentType[] = EQUIPMENT_TYPE_OPTIONS.map((o) => o.value);

export function estTypeMateriel(valeur: string): valeur is EquipmentType {
	return (EQUIPMENT_TYPES as string[]).includes(valeur);
}

export function equipmentTypeLabel(valeur: string): string {
	return EQUIPMENT_TYPE_OPTIONS.find((o) => o.value === valeur)?.label ?? valeur;
}

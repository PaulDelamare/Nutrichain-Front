export const EQUIPMENT_TYPE_OPTIONS = [
	{ value: 'FRIGO', label: 'Frigo' },
	{ value: 'CONGELATEUR', label: 'Congélateur' },
	{ value: 'CUVE', label: 'Cuve' },
	{ value: 'ETAGERE', label: 'Étagère' },
	{ value: 'MIXEUR', label: 'Mixeur' }
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPE_OPTIONS)[number]['value'];

export const EQUIPMENT_TYPES: EquipmentType[] = EQUIPMENT_TYPE_OPTIONS.map((o) => o.value);

export const COLD_EQUIPMENT_TYPES: EquipmentType[] = ['FRIGO', 'CONGELATEUR'];

export function equipmentTypeLabel(type: string): string {
	return EQUIPMENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

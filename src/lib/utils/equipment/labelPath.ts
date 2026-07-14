export function equipmentLabelPath(equipmentId: string): string {
	return `/configuration/equipment/${encodeURIComponent(equipmentId)}/label`;
}

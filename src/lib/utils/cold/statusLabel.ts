import type { ColdAlertStatus } from '$lib/types/cold';

const labels: Record<ColdAlertStatus, string> = {
	critique: 'Critique',
	investigation: 'Investigation'
};

export function coldStatusLabel(statut: ColdAlertStatus): string {
	return labels[statut];
}

import { describe, it, expect } from 'vitest';
import { auditLogsToRows } from './mappers';
import type { ApiAuditLog } from '$lib/Api/organization.server';

function auditLog(partial: Partial<ApiAuditLog>): ApiAuditLog {
	return {
		id: 1,
		action: 'CREATE',
		entity: 'Batch',
		entity_id: 'lot-1',
		horodatage: '2026-07-11T10:00:00.000Z',
		...partial
	};
}

describe('auditLogsToRows', () => {
	it('traduit une action connue en libellé lisible et conserve le code brut', () => {
		const [row] = auditLogsToRows([auditLog({ action: 'LIFT_BATCH_QUARANTINE' })]);
		expect(row.actionLabel).toBe('Levée de quarantaine');
		expect(row.action).toBe('LIFT_BATCH_QUARANTINE');
	});

	it('retombe sur le code brut pour une action inconnue', () => {
		const [row] = auditLogsToRows([auditLog({ action: 'ACTION_INEXISTANTE' })]);
		expect(row.actionLabel).toBe('ACTION_INEXISTANTE');
	});

	it('extrait le motif depuis nouvelle_valeur', () => {
		const [row] = auditLogsToRows([
			auditLog({
				action: 'LIFT_BATCH_QUARANTINE',
				nouvelle_valeur: { statut: 'EN_STOCK', motif: '2e contrôle conforme' }
			})
		]);
		expect(row.detail).toBe('2e contrôle conforme');
	});

	it('affiche le changement de statut quand il n’y a pas de motif', () => {
		const [row] = auditLogsToRows([
			auditLog({
				ancienne_valeur: { statut: 'EN_STOCK' },
				nouvelle_valeur: { statut: 'ALERTE' }
			})
		]);
		expect(row.detail).toBe('EN_STOCK → ALERTE');
	});

	it('laisse le détail vide sans motif ni changement de statut', () => {
		const [row] = auditLogsToRows([auditLog({})]);
		expect(row.detail).toBe('');
	});
});

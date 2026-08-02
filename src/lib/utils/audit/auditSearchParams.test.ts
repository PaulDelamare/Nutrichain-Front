import { describe, it, expect } from 'vitest';
import { auditPageSizeParams, auditSearchParams } from './auditSearchParams';
import { emptyAuditFilters } from '$lib/types/audit';

const params = (init = '') => new URLSearchParams(init);

describe('auditSearchParams', () => {
	it('ne pose aucun filtre quand tout est vide / « tous »', () => {
		expect(auditSearchParams(params(), emptyAuditFilters()).toString()).toBe('');
	});

	it('pose action et entity sauf la sentinelle « tous » (ENUM conservé)', () => {
		const out = auditSearchParams(params(), {
			...emptyAuditFilters(),
			action: 'CREATE_SHIPMENT',
			entity: 'Shipment'
		});
		expect(out.get('action')).toBe('CREATE_SHIPMENT');
		expect(out.get('entity')).toBe('Shipment');
	});

	it('ignore un identifiant de moins de 3 caractères, le pose dès 3 (trimé)', () => {
		expect(
			auditSearchParams(params(), { ...emptyAuditFilters(), entityId: 'ab' }).has('entity_id')
		).toBe(false);
		expect(
			auditSearchParams(params(), { ...emptyAuditFilters(), entityId: '  ab12 ' }).get('entity_id')
		).toBe('ab12');
	});

	it('pose le créneau from/to tel quel', () => {
		const out = auditSearchParams(params(), {
			...emptyAuditFilters(),
			from: '2026-08-01T00:00',
			to: '2026-08-02T12:30'
		});
		expect(out.get('from')).toBe('2026-08-01T00:00');
		expect(out.get('to')).toBe('2026-08-02T12:30');
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = auditSearchParams(params('page=4'), { ...emptyAuditFilters(), entity: 'Batch' });
		expect(out.has('page')).toBe(false);
	});

	it('préserve les autres paramètres (ex. limit)', () => {
		const out = auditSearchParams(params('limit=50'), { ...emptyAuditFilters(), entity: 'Batch' });
		expect(out.get('limit')).toBe('50');
	});
});

describe('auditPageSizeParams', () => {
	it('pose la taille et repart en première page, en gardant les filtres', () => {
		const out = auditPageSizeParams(params('page=5&entity=Batch'), 25);
		expect(out.get('limit')).toBe('25');
		expect(out.has('page')).toBe(false);
		expect(out.get('entity')).toBe('Batch');
	});
});

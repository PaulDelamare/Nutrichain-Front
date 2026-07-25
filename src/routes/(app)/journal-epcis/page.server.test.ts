import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = {
	getEvents: vi.fn()
};

vi.mock('$lib/Api/traceability.server', () => api);

const mod = await import('./+page.server');

const event = (overrides: Partial<Record<string, unknown>> = {}) => ({
	id: 'evt-1',
	event_time: '2026-07-25T10:00:00.000Z',
	event_type: 'ObjectEvent',
	related_entity: 'Receipt',
	related_id: 'receipt-1',
	payload: { bizStep: 'urn:epcglobal:cbv:bizstep:receiving' },
	...overrides
});

const evt = (url: URL) => ({ fetch: vi.fn(), cookies: {}, url });

beforeEach(() => {
	api.getEvents.mockReset();
	api.getEvents.mockResolvedValue({
		ok: true,
		data: { data: [event()], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }
	});
});

describe('journal-epcis +page.server load', () => {
	it("demande la page 1 et la limite par defaut sans parametre d'URL", async () => {
		const result = await mod.load(evt(new URL('http://x/journal-epcis')) as never);

		expect(api.getEvents).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
			page: 1,
			limit: 20,
			eventType: undefined,
			relatedEntity: undefined
		});
		expect(result).toEqual({
			events: [event()],
			pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			eventType: null,
			relatedEntity: null,
			error: null
		});
	});

	it('transmet page, event_type et related_entity depuis les query params', async () => {
		await mod.load(
			evt(
				new URL('http://x/journal-epcis?page=3&event_type=AggregationEvent&related_entity=Shipment')
			) as never
		);

		expect(api.getEvents).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
			page: 3,
			limit: 20,
			eventType: 'AggregationEvent',
			relatedEntity: 'Shipment'
		});
	});

	it("retombe sur la page 1 si le parametre page n'est pas un nombre", async () => {
		await mod.load(evt(new URL('http://x/journal-epcis?page=abc')) as never);

		expect(api.getEvents).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
			page: 1,
			limit: 20,
			eventType: undefined,
			relatedEntity: undefined
		});
	});

	it("renvoie une liste vide et le message d'erreur si l'API echoue, sans planter", async () => {
		api.getEvents.mockResolvedValue({ ok: false, status: 503, message: 'API injoignable' });

		const result = await mod.load(evt(new URL('http://x/journal-epcis')) as never);

		expect(result).toEqual({
			events: [],
			pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
			eventType: null,
			relatedEntity: null,
			error: 'API injoignable'
		});
	});
});

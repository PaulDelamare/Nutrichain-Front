import type { PageServerLoad } from './$types';
import { getEvents } from '$lib/Api/traceability.server';

const DEFAULT_LIMIT = 20;

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const eventType = url.searchParams.get('event_type') ?? undefined;
	const relatedEntity = url.searchParams.get('related_entity') ?? undefined;

	const events = await getEvents(fetch, cookies, {
		page,
		limit: DEFAULT_LIMIT,
		eventType,
		relatedEntity
	});

	if (!events.ok) {
		return {
			events: [],
			pagination: { page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 0 },
			eventType: eventType ?? null,
			relatedEntity: relatedEntity ?? null,
			error: events.message
		};
	}

	return {
		events: events.data.data,
		pagination: events.data.pagination,
		eventType: eventType ?? null,
		relatedEntity: relatedEntity ?? null,
		error: null
	};
};

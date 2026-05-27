import type { PageServerLoad } from './$types';
import { getMembers } from '$lib/Api/organization.server';
import { membersToUsers, mockUsers } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const res = await getMembers(fetch, cookies);

	if (res.ok) {
		return { users: membersToUsers(res.data), source: 'api' as const };
	}

	return { users: mockUsers, source: 'mock' as const, error: res.message };
};

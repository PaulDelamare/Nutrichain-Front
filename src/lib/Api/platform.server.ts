import type { Cookies } from '@sveltejs/kit';
import { api } from './client.server';

export type ApiOrganization = {
	id: string;
	name: string;
	slug: string;
	createdAt: string;
	membersCount: number;
};

export const getOrganizations = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	api(fetch, cookies).get<ApiOrganization[]>('/api/platform/organizations');

export const createOrganization = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	body: { name: string; slug: string; gs1_company_prefix?: string }
) => api(fetch, cookies).post<ApiOrganization>('/api/platform/organizations', body);

export const inviteOrganizationOwner = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	organizationId: string,
	email: string
) =>
	api(fetch, cookies).post<{ invitationId: string; expiresAt: string }>(
		`/api/platform/organizations/${organizationId}/owner`,
		{ email }
	);

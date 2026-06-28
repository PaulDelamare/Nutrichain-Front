import type { Cookies } from '@sveltejs/kit';
import type { InviteRole } from '$lib/config/invite-roles';
import { api } from './client.server';

export type InvitationPreview = {
	email: string;
	role: string | null;
	status: string;
	expiresAt: string;
};

export function sendInvitation(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	payload: { email: string; role: InviteRole; organizationId: string }
) {
	return api(fetch, cookies).post<{ invitationId: string; expiresAt: string }>(
		'/api/identity/invitations',
		payload
	);
}

export function getInvitationPreview(fetch: typeof globalThis.fetch, token: string) {
	return api(fetch).get<InvitationPreview>(`/api/identity/invitations/${token}/preview`);
}

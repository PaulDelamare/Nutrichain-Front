import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getMe } from '$lib/Api/auth.server';
import { getMembers } from '$lib/Api/organization.server';
import { canInviteMembers, INVITE_ROLES, type InviteRole } from '$lib/config/invite-roles';
import { sendInvitation } from '$lib/Api/identity.server';
import { membersToUsers } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies, locals }) => {
	const membersRes = await getMembers(fetch, cookies);

	let canInvite = false;
	let currentRole: string | undefined;

	if (membersRes.ok && locals.user) {
		const member = membersRes.data.find((m) => m.user.email === locals.user!.email);
		currentRole = member?.role;
		canInvite = canInviteMembers(currentRole);
	}

	if (!membersRes.ok) {
		return {
			users: [],
			error: membersRes.message,
			canInvite: false,
			currentRole
		};
	}

	return {
		users: membersToUsers(membersRes.data),
		canInvite,
		currentRole
	};
};

export const actions = {
	invite: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const role = String(form.get('role') ?? '') as InviteRole;

		if (!email) {
			return fail(400, { error: 'Adresse e-mail requise.', email, role });
		}

		if (!INVITE_ROLES.includes(role)) {
			return fail(400, { error: 'Rôle invalide.', email, role });
		}

		const me = await getMe(fetch, cookies);
		if (!me.ok || !me.data.activeOrgId) {
			return fail(403, {
				error: 'Organisation active introuvable. Reconnectez-vous.',
				email,
				role
			});
		}

		const res = await sendInvitation(fetch, cookies, {
			email,
			role,
			organizationId: me.data.activeOrgId
		});

		if (!res.ok) {
			return fail(res.status === 429 ? 429 : res.status, {
				error: res.message,
				email,
				role
			});
		}

		return {
			success: true,
			message: `Invitation envoyée à ${email}.`,
			email: '',
			role: 'operator' as InviteRole
		};
	}
} satisfies Actions;

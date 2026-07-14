import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getMe } from '$lib/Api/auth.server';
import { getMembers, revokeMember, updateMemberRole } from '$lib/Api/organization.server';
import { canInviteMembers, INVITE_ROLES, type InviteRole } from '$lib/config/invite-roles';
import { sendInvitation } from '$lib/Api/identity.server';
import { membersToUsers } from '$lib/utils/org/mappers';
import { exigerAdministrateur, refusAdministration } from '$lib/server/guards';

export const load: PageServerLoad = async ({ fetch, cookies, locals }) => {
	exigerAdministrateur(locals.user, "L'administration des utilisateurs");

	const canInvite = canInviteMembers(locals.user?.role);

	const membersRes = await getMembers(fetch, cookies);

	if (!membersRes.ok) {
		return {
			users: [],
			error: membersRes.message,
			canInvite: false,
			canManage: false,
			currentUserId: locals.user?.id ?? ''
		};
	}

	return {
		users: membersToUsers(membersRes.data),
		canInvite,
		canManage: canInvite,
		currentUserId: locals.user?.id ?? ''
	};
};

export const actions = {
	role: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { error: refus });

		const form = await request.formData();
		const memberId = String(form.get('memberId') ?? '');
		const role = String(form.get('role') ?? '');

		if (!memberId || !INVITE_ROLES.includes(role as InviteRole)) {
			return fail(400, { error: 'Paramètres invalides.' });
		}

		const res = await updateMemberRole(fetch, cookies, memberId, role);
		if (!res.ok) {
			return fail(res.status, { error: res.message });
		}

		return { success: true, message: 'Rôle mis à jour.' };
	},

	revoke: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { error: refus });

		const memberId = String((await request.formData()).get('memberId') ?? '');
		if (!memberId) return fail(400, { error: 'Membre introuvable.' });

		const res = await revokeMember(fetch, cookies, memberId);
		if (!res.ok) {
			return fail(res.status, { error: res.message });
		}

		return { success: true, message: 'Accès révoqué.' };
	},

	invite: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();

		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { error: refus });
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

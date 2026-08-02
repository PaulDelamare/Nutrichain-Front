import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getMe } from '$lib/Api/auth.server';
import { changeMemberRole, getMembers, revokeMember } from '$lib/Api/organization.server';
import { canInviteMembers, INVITE_ROLES, type InviteRole } from '$lib/config/invite-roles';
import { sendInvitation } from '$lib/Api/identity.server';
import { membersToUsers } from '$lib/utils/org/mappers';
import { exigerAdministrateur, refusAdministration } from '$lib/server/guards';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const emptyPagination = { page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 };

/** Une page hors bornes (`?page=0`, `?page=abc`) est un lien copié de travers, pas une erreur 400. */
function parsePage(raw: string | null): number {
	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

/** `limit` est borné à la liste du sélecteur : un `?limit=999` copié retombe sur le défaut. */
function parseLimit(raw: string | null): number {
	const parsed = Number(raw);
	return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

/** `mfa` d'URL est un booléen strict : tout le reste (absent, malformé) vaut « peu importe ». */
function parseMfa(raw: string | null): boolean | undefined {
	if (raw === 'true') return true;
	if (raw === 'false') return false;
	return undefined;
}

export const load: PageServerLoad = async ({ fetch, cookies, locals, url }) => {
	exigerAdministrateur(locals.user, "L'administration des utilisateurs");

	const canInvite = canInviteMembers(locals.user?.role);

	const p = url.searchParams;
	const page = parsePage(p.get('page'));
	const limit = parseLimit(p.get('limit'));
	// Filtres de colonnes portés par l'URL : la requête part filtrée à l'API (plus de tri sur la
	// seule page reçue), et un lien filtré reste partageable / rechargeable.
	const email = p.get('email')?.trim() || undefined;
	const role = p.get('role')?.trim() || undefined;
	const mfa = parseMfa(p.get('mfa'));

	const membersRes = await getMembers(fetch, cookies, { page, limit, email, role, mfa });

	const filters = {
		email: email ?? '',
		role: role ?? 'tous',
		mfa: mfa === true ? 'actif' : mfa === false ? 'inactif' : 'tous'
	};
	const meta = { filters, pageSize: limit, pageSizeOptions: [...PAGE_SIZE_OPTIONS] };

	if (!membersRes.ok) {
		return {
			users: [],
			pagination: { ...emptyPagination, limit },
			error: membersRes.message,
			canInvite: false,
			currentUserId: locals.user?.id,
			...meta
		};
	}

	return {
		users: membersToUsers(membersRes.data.data),
		pagination: membersRes.data.pagination,
		error: null,
		canInvite,
		currentUserId: locals.user?.id,
		...meta
	};
};

export const actions = {
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
			scope: 'invite' as const,
			success: true,
			message: `Invitation envoyée à ${email}.`,
			email: '',
			role: 'operator' as InviteRole
		};
	},

	changeRole: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { scope: 'member' as const, error: refus });

		const form = await request.formData();
		const memberId = String(form.get('memberId') ?? '');
		const role = String(form.get('role') ?? '') as InviteRole;

		if (!memberId) return fail(400, { scope: 'member' as const, error: 'Membre introuvable.' });
		if (!INVITE_ROLES.includes(role)) {
			return fail(400, { scope: 'member' as const, error: 'Rôle invalide.' });
		}

		const res = await changeMemberRole(fetch, cookies, memberId, role);
		if (!res.ok) return fail(res.status, { scope: 'member' as const, error: res.message });

		return { scope: 'member' as const, success: true, message: 'Rôle mis à jour.' };
	},

	revoke: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { scope: 'member' as const, error: refus });

		const form = await request.formData();
		const memberId = String(form.get('memberId') ?? '');
		if (!memberId) return fail(400, { scope: 'member' as const, error: 'Membre introuvable.' });

		const res = await revokeMember(fetch, cookies, memberId);
		if (!res.ok) return fail(res.status, { scope: 'member' as const, error: res.message });

		return { scope: 'member' as const, success: true, message: 'Accès révoqué.' };
	}
} satisfies Actions;

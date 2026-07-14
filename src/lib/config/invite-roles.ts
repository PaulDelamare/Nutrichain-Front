import { peutAdministrer, type KnownRole } from './roles';

export type InviteRole = 'admin' | 'quality' | 'operator' | 'viewer';

export const INVITE_ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
	{ value: 'operator', label: 'Opérateur' },
	{ value: 'quality', label: 'Qualité' },
	{ value: 'admin', label: 'Administrateur' },
	{ value: 'viewer', label: 'Lecteur' }
];

export const INVITE_ROLES: InviteRole[] = INVITE_ROLE_OPTIONS.map((r) => r.value);

export function inviteRoleLabel(role: string | null | undefined): string {
	return INVITE_ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role ?? 'Membre';
}

export function canInviteMembers(role: KnownRole): boolean {
	return peutAdministrer(role);
}

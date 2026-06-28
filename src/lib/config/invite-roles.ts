export type InviteRole = 'owner' | 'admin' | 'manager' | 'operator';

export const INVITE_ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
	{ value: 'operator', label: 'Opérateur' },
	{ value: 'manager', label: 'Manager' },
	{ value: 'admin', label: 'Administrateur' },
	{ value: 'owner', label: 'Propriétaire' }
];

export const INVITE_ROLES: InviteRole[] = INVITE_ROLE_OPTIONS.map((r) => r.value);

export function inviteRoleLabel(role: string | null | undefined): string {
	return INVITE_ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role ?? 'Membre';
}

export function canInviteMembers(role: string | undefined): boolean {
	return role === 'owner' || role === 'admin';
}

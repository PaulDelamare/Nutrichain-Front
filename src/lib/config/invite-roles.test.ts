import { describe, it, expect } from 'vitest';
import {
	INVITE_ROLES,
	INVITE_ROLE_OPTIONS,
	inviteRoleLabel,
	canInviteMembers
} from './invite-roles';

describe('rôles proposés à l’invitation', () => {
	it('expose les mêmes valeurs que les options du formulaire', () => {
		expect(INVITE_ROLES).toEqual(INVITE_ROLE_OPTIONS.map((o) => o.value));
	});

	it('ne propose jamais le rôle propriétaire — il ne se délègue pas par invitation', () => {
		expect(INVITE_ROLES).not.toContain('owner');
	});
});

describe('inviteRoleLabel', () => {
	it('traduit les rôles connus', () => {
		expect(inviteRoleLabel('quality')).toBe('Qualité');
		expect(inviteRoleLabel('operator')).toBe('Opérateur');
	});

	it('retombe sur « Membre » quand l’API ne renvoie pas de rôle', () => {
		expect(inviteRoleLabel(null)).toBe('Membre');
		expect(inviteRoleLabel(undefined)).toBe('Membre');
	});

	it('affiche le rôle brut plutôt que rien pour un rôle inconnu', () => {
		expect(inviteRoleLabel('auditeur')).toBe('auditeur');
	});
});

describe('canInviteMembers', () => {
	it('réserve l’invitation aux rôles d’administration', () => {
		expect(canInviteMembers('owner')).toBe(true);
		expect(canInviteMembers('admin')).toBe(true);
	});

	it('interdit l’invitation aux rôles opérationnels et en lecture', () => {
		expect(canInviteMembers('quality')).toBe(false);
		expect(canInviteMembers('operator')).toBe(false);
		expect(canInviteMembers('viewer')).toBe(false);
	});
});

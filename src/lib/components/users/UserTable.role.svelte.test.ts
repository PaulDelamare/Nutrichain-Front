import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import UserTable from './UserTable.svelte';
import type { AppUser } from '$lib/types/user';

const OWNER: AppUser = {
	memberId: 'm-owner',
	userId: 'u-owner',
	email: 'owner@x.fr',
	role: 'Propriétaire',
	rawRole: 'owner',
	lastLogin: '—',
	mfa: true
};
const MOI: AppUser = {
	memberId: 'm-moi',
	userId: 'u-moi',
	email: 'moi@x.fr',
	role: 'Administrateur',
	rawRole: 'admin',
	lastLogin: '—',
	mfa: false
};
const AUTRE: AppUser = {
	memberId: 'm-autre',
	userId: 'u-autre',
	email: 'autre@x.fr',
	role: 'Opérateur',
	rawRole: 'operator',
	lastLogin: '—',
	mfa: false
};

function renderTable(props: { rows: AppUser[]; canManage?: boolean; currentUserId?: string }) {
	render(UserTable, { props } as unknown as SvelteComponentOptions<typeof UserTable>);
}

describe('UserTable — gestion des membres', () => {
	it("n'affiche aucune action à un rôle qui ne peut pas administrer", async () => {
		renderTable({ rows: [AUTRE], canManage: false });

		await expect.element(page.getByText('autre@x.fr')).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Révoquer' }).all()).toHaveLength(0);
	});

	it('offre le changement de rôle et la révocation sur un membre ordinaire', async () => {
		renderTable({ rows: [AUTRE], canManage: true, currentUserId: 'u-moi' });

		await expect.element(page.getByRole('button', { name: 'Révoquer' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Appliquer' })).toBeInTheDocument();
		await expect.element(page.getByLabelText('Rôle de autre@x.fr')).toBeInTheDocument();
	});

	it('ne propose aucune action sur le propriétaire (ancre de gouvernance)', async () => {
		renderTable({ rows: [OWNER], canManage: true, currentUserId: 'u-moi' });

		await expect.element(page.getByText('owner@x.fr')).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Révoquer' }).all()).toHaveLength(0);
	});

	it('ne propose aucune action sur sa propre ligne (pas d’auto-verrouillage)', async () => {
		renderTable({ rows: [MOI], canManage: true, currentUserId: 'u-moi' });

		await expect.element(page.getByText('moi@x.fr')).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Révoquer' }).all()).toHaveLength(0);
	});
});

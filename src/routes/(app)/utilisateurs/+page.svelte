<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import UserTable from '$lib/components/users/UserTable.svelte';
	import UserFilters from '$lib/components/users/UserFilters.svelte';
	import { INVITE_ROLE_OPTIONS } from '$lib/config/invite-roles';
	import { ROLES, roleLabel } from '$lib/config/roles';
	import { pageHref } from '$lib/utils/pageSearch/pageHref';
	import { usersSearchParams, usersPageSizeParams } from '$lib/utils/users/usersSearchParams';
	import { emptyUserFilters } from '$lib/types/user';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Une réponse d'action « membre » (rôle / révocation) porte `scope: 'member'` ; l'invitation non.
	// On sépare les deux flux de feedback pour ne pas afficher l'erreur de l'un sous le tableau de
	// l'autre.
	type InviteView = {
		success?: boolean;
		message?: string;
		error?: string;
		email?: string;
		role?: string;
	} | null;

	const isMemberForm = $derived(form && 'scope' in form && form.scope === 'member');
	const inviteForm: InviteView = $derived(isMemberForm ? null : (form as InviteView));
	const memberForm = $derived(isMemberForm ? form : null);

	// --- Filtres pilotés par l'URL (requête filtrée côté API) ---
	// eslint-disable-next-line svelte/prefer-writable-derived
	let filters = $state(emptyUserFilters());
	$effect(() => {
		filters = { ...data.filters };
	});

	const roleOptions = [
		{ label: 'Tous les rôles', value: 'tous' },
		...ROLES.map((r) => ({ label: roleLabel(r), value: r }))
	];

	const hrefForPage = $derived((target: number) =>
		pageHref(resolve('/utilisateurs'), $page.url.searchParams, target)
	);

	function navigate(params: URLSearchParams) {
		const qs = params.toString();
		if (qs === $page.url.searchParams.toString()) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/utilisateurs')}${qs ? `?${qs}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function apply() {
		navigate(usersSearchParams($page.url.searchParams, filters));
	}

	function changePageSize(event: Event) {
		const size = Number((event.currentTarget as HTMLSelectElement).value);
		navigate(usersPageSizeParams($page.url.searchParams, size));
	}

	// --- Modale d'invitation ---
	let inviteOpen = $state(false);
	let envoi = $state(false);

	const onInvite: SubmitFunction = () => {
		envoi = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				inviteOpen = false;
			} else {
				await update({ reset: false, invalidateAll: false });
			}
			envoi = false;
		};
	};
</script>

<PageHead
	heading="Utilisateurs, rôles & sécurité"
	description="Gestion des accès — RBAC, MFA, politique de mot de passe."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

{#if inviteForm?.success}
	<p class="feedback success" role="status">{inviteForm.message}</p>
{/if}

{#if memberForm?.success}
	<p class="feedback success" role="status">{memberForm.message}</p>
{:else if memberForm?.error}
	<p class="feedback error" role="status">{memberForm.error}</p>
{/if}

{#if !data.error}
	<div class="topbar">
		{#if data.canInvite}
			<button type="button" class="add" onclick={() => (inviteOpen = true)}>
				Inviter un utilisateur
			</button>
		{:else}
			<p class="hint">Seuls les administrateurs peuvent inviter de nouveaux utilisateurs.</p>
		{/if}
	</div>

	<UserFilters bind:filters {roleOptions} onapply={apply} />

	<div class="toolbar">
		<label class="page-size">
			<span>Afficher</span>
			<select
				value={String(data.pageSize)}
				onchange={changePageSize}
				aria-label="Utilisateurs par page"
			>
				{#each data.pageSizeOptions as size (size)}
					<option value={String(size)}>{size} par page</option>
				{/each}
			</select>
		</label>
	</div>

	<div class="results">
		<UserTable rows={data.users} canManage={data.canInvite} currentUserId={data.currentUserId} />
	</div>

	<Pagination
		page={data.pagination.page}
		totalPages={data.pagination.totalPages}
		total={data.pagination.total}
		unit="utilisateurs"
		hrefFor={hrefForPage}
	/>
{/if}

<Modal open={inviteOpen} title="Inviter un utilisateur" onclose={() => (inviteOpen = false)}>
	<form method="POST" action="?/invite" use:enhance={onInvite} class="modal-form">
		{#if inviteForm?.error}
			<p class="err" role="alert">❌ {inviteForm.error}</p>
		{/if}

		<p class="hint">
			Un e-mail d'invitation sera envoyé. La personne pourra créer son compte via le lien reçu.
		</p>

		<label>
			<span>Adresse e-mail</span>
			<input
				type="email"
				name="email"
				value={inviteForm?.email ?? ''}
				required
				autocomplete="email"
			/>
		</label>

		<label>
			<span>Rôle</span>
			<select name="role" required>
				{#each INVITE_ROLE_OPTIONS as opt (opt.value)}
					<option value={opt.value} selected={opt.value === (inviteForm?.role ?? 'operator')}>
						{opt.label}
					</option>
				{/each}
			</select>
		</label>

		<button type="submit" class="submit" disabled={envoi}>Envoyer l'invitation</button>
	</form>
</Modal>

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

	.feedback {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}

	.feedback.success {
		background: rgba(27, 107, 92, 0.08);
		color: var(--nc-brand-dark);
	}

	.feedback.error {
		background: #fef2f2;
		color: #991b1b;
	}

	/* Bouton d'action à GAUCHE (et non à droite comme les autres listings) : demandé ici pour
	   rapprocher l'appel à l'action du début de lecture de la page. */
	.topbar {
		display: flex;
		justify-content: flex-start;
		margin-bottom: 1rem;
	}

	.add {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.add:hover {
		background: var(--nc-brand-hover);
	}

	.hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}

	.toolbar {
		display: flex;
		justify-content: flex-end;
		margin: 1rem 0 0.75rem;
	}

	.page-size {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.page-size select {
		height: 2.25rem;
		padding: 0 0.6rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.875rem;
		color: var(--nc-text);
	}

	.page-size select:focus {
		outline: 2px solid var(--nc-brand-ring);
		outline-offset: 0;
		border-color: var(--nc-brand-border-focus);
	}

	/* --- Formulaire en modale --- */
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-form label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--nc-text-muted);
	}

	.modal-form input,
	.modal-form select {
		padding: 0.5rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--nc-text);
	}

	.submit {
		margin-top: 0.25rem;
		padding: 0.55rem 0.9rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.submit:hover {
		background: var(--nc-brand-hover);
	}

	.submit:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.err {
		margin: 0;
		font-size: 0.8125rem;
		color: #b91c1c;
	}
</style>

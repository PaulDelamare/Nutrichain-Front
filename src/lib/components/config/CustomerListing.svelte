<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onDestroy, tick } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import NcFilterBar from '$lib/components/nc/NcFilterBar.svelte';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';
	import { peutAdministrer, type KnownRole } from '$lib/config/roles';
	import { debounce } from '$lib/utils/debounce';
	import { pageHref } from '$lib/utils/pageSearch/pageHref';
	import {
		customersSearchParams,
		customersPageSizeParams
	} from '$lib/utils/config/customersSearchParams';
	import { emptyCustomerFilters, type CustomerFilters } from '$lib/types/customer';
	import type { ApiCustomerComplet, ApiCustomerList } from '$lib/Api/organization.server';

	type CustomerForm = {
		customerError?: string;
		customerCreated?: unknown;
		customerUpdated?: unknown;
	} | null;

	type Props = {
		customers: ApiCustomerList;
		filters: CustomerFilters;
		pageSize: number;
		pageSizeOptions: number[];
		form?: CustomerForm;
		role: KnownRole;
	};

	let {
		customers,
		filters: dataFilters,
		pageSize,
		pageSizeOptions,
		form = null,
		role
	}: Props = $props();

	const canManage = $derived(peutAdministrer(role));

	// --- Filtres pilotés par l'URL (requête filtrée côté API) ---
	// eslint-disable-next-line svelte/prefer-writable-derived
	let filters = $state(emptyCustomerFilters());
	$effect(() => {
		filters = { ...dataFilters };
	});

	const hrefForPage = $derived((target: number) =>
		pageHref(resolve('/configuration'), $page.url.searchParams, target)
	);

	function navigate(params: URLSearchParams) {
		const qs = params.toString();
		if (qs === $page.url.searchParams.toString()) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/configuration')}${qs ? `?${qs}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	const applyDebounced = debounce(() => apply(), 500);
	onDestroy(() => applyDebounced.cancel());

	function apply() {
		navigate(customersSearchParams($page.url.searchParams, filters));
	}

	async function applyImmediately() {
		applyDebounced.cancel();
		await tick();
		apply();
	}

	function changePageSize(event: Event) {
		const size = Number((event.currentTarget as HTMLSelectElement).value);
		navigate(customersPageSizeParams($page.url.searchParams, size));
	}

	const columns = $derived(
		canManage
			? ['Enseigne', 'Adresse de livraison', 'E-mail', 'Statut', 'Actions']
			: ['Enseigne', 'Adresse de livraison', 'E-mail', 'Statut']
	);

	// Modale partagée create / edit.
	type Editing = { mode: 'create' } | { mode: 'edit'; customer: ApiCustomerComplet } | null;
	let editing = $state<Editing>(null);
	let envoi = $state(false);

	const modalTitle = $derived(
		editing?.mode === 'edit' ? 'Modifier le client' : 'Ajouter un client'
	);

	const onSave: SubmitFunction = () => {
		envoi = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				editing = null;
			} else {
				await update({ reset: false, invalidateAll: false });
			}
			envoi = false;
		};
	};
</script>

<div class="topbar">
	{#if canManage}
		<button type="button" class="add" onclick={() => (editing = { mode: 'create' })}>
			Ajouter un client
		</button>
	{/if}
</div>

<NcFilterBar onapply={apply}>
	<label class="field">
		<span>Enseigne</span>
		<input
			type="text"
			placeholder="Nom de l'enseigne"
			bind:value={filters.nom}
			oninput={() => applyDebounced()}
		/>
	</label>
	<label class="field">
		<span>Statut</span>
		<select bind:value={filters.statut} onchange={applyImmediately}>
			<option value="tous">Tous les statuts</option>
			<option value="actif">Actif</option>
			<option value="archive">Archivé</option>
		</select>
	</label>
</NcFilterBar>

<div class="toolbar">
	<label class="page-size">
		<span>Afficher</span>
		<select value={String(pageSize)} onchange={changePageSize} aria-label="Clients par page">
			{#each pageSizeOptions as size (size)}
				<option value={String(size)}>{size} par page</option>
			{/each}
		</select>
	</label>
</div>

<div class="results">
	<DataTable
		{columns}
		rows={customers.data}
		rowKey={(c) => c.id}
		empty="Aucun client ne correspond aux filtres."
	>
		{#snippet row(c)}
			<td class="nom">{c.nom_enseigne}</td>
			<td>{c.adresse_livraison}</td>
			<td>{c.email ?? '—'}</td>
			<td>{c.is_active ? 'Actif' : 'Archivé'}</td>
			{#if canManage}
				<td class="actions">
					<button
						type="button"
						class="link-btn"
						onclick={() => (editing = { mode: 'edit', customer: c })}
					>
						Éditer
					</button>
					<form method="POST" action="?/toggleCustomer" use:enhance={onSave} class="inline">
						<input type="hidden" name="id" value={c.id} />
						<input type="hidden" name="active" value={String(!c.is_active)} />
						<button type="submit" class="link-btn">{c.is_active ? 'Archiver' : 'Réactiver'}</button>
					</form>
				</td>
			{/if}
		{/snippet}
	</DataTable>
</div>

<Pagination
	page={customers.pagination.page}
	totalPages={customers.pagination.totalPages}
	total={customers.pagination.total}
	unit="clients"
	hrefFor={hrefForPage}
/>

{#if !canManage && customers.pagination.total > 0}
	<ActionReservee action="La gestion des clients" {role} />
{/if}

<Modal open={editing !== null} title={modalTitle} onclose={() => (editing = null)}>
	{#if editing}
		<form
			method="POST"
			action={editing.mode === 'edit' ? '?/updateCustomer' : '?/createCustomer'}
			use:enhance={onSave}
			class="modal-form"
		>
			{#if form?.customerError}
				<p class="err" role="alert">❌ {form.customerError}</p>
			{/if}
			{#if editing.mode === 'edit'}
				<input type="hidden" name="id" value={editing.customer.id} />
			{/if}

			<label>
				<span>Enseigne</span>
				<input
					name="nom_enseigne"
					required
					minlength="2"
					maxlength="120"
					value={editing.mode === 'edit' ? editing.customer.nom_enseigne : ''}
				/>
			</label>

			<label>
				<span>Adresse de livraison</span>
				<input
					name="adresse_livraison"
					required
					minlength="2"
					maxlength="200"
					value={editing.mode === 'edit' ? editing.customer.adresse_livraison : ''}
				/>
			</label>

			<label>
				<span>E-mail (facultatif)</span>
				<input
					name="email"
					type="email"
					maxlength="200"
					value={editing.mode === 'edit' ? (editing.customer.email ?? '') : ''}
				/>
			</label>

			<label>
				<span>Contact d'urgence (facultatif)</span>
				<input
					name="contact_urgence"
					maxlength="120"
					value={editing.mode === 'edit' ? (editing.customer.contact_urgence ?? '') : ''}
				/>
			</label>

			<label>
				<span>Notes (facultatif)</span>
				<input
					name="notes"
					maxlength="500"
					value={editing.mode === 'edit' ? (editing.customer.notes ?? '') : ''}
				/>
			</label>

			<button type="submit" class="submit" disabled={envoi}>
				{editing.mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
			</button>
		</form>
	{/if}
</Modal>

<style>
	/* Bouton d'action à gauche : rapproche l'appel à l'action du début de lecture de la page. */
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

	.results {
		margin-top: 0.25rem;
	}

	.nom {
		font-weight: 600;
		color: var(--nc-text);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.inline {
		display: inline;
	}

	.link-btn {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--nc-brand);
		cursor: pointer;
	}

	.link-btn:hover {
		text-decoration: underline;
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

	.modal-form input {
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

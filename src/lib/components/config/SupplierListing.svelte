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
		suppliersSearchParams,
		suppliersPageSizeParams
	} from '$lib/utils/config/suppliersSearchParams';
	import { emptySupplierFilters, type SupplierFilters } from '$lib/types/supplier';
	import type { ApiSupplierComplet, ApiSupplierList } from '$lib/Api/organization.server';

	type SupplierForm = {
		supplierError?: string;
		supplierCreated?: unknown;
		supplierUpdated?: unknown;
	} | null;

	type Props = {
		suppliers: ApiSupplierList;
		filters: SupplierFilters;
		pageSize: number;
		pageSizeOptions: number[];
		form?: SupplierForm;
		role: KnownRole;
	};

	let {
		suppliers,
		filters: dataFilters,
		pageSize,
		pageSizeOptions,
		form = null,
		role
	}: Props = $props();

	const canManage = $derived(peutAdministrer(role));

	// --- Filtres pilotés par l'URL (requête filtrée côté API) ---
	// eslint-disable-next-line svelte/prefer-writable-derived
	let filters = $state(emptySupplierFilters());
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
		navigate(suppliersSearchParams($page.url.searchParams, filters));
	}

	async function applyImmediately() {
		applyDebounced.cancel();
		await tick();
		apply();
	}

	function changePageSize(event: Event) {
		const size = Number((event.currentTarget as HTMLSelectElement).value);
		navigate(suppliersPageSizeParams($page.url.searchParams, size));
	}

	const columns = $derived(
		canManage
			? ['Nom', 'Adresse siège', 'Type produit', 'Statut', 'Actions']
			: ['Nom', 'Adresse siège', 'Type produit', 'Statut']
	);

	// Modale partagée create / edit.
	type Editing = { mode: 'create' } | { mode: 'edit'; supplier: ApiSupplierComplet } | null;
	let editing = $state<Editing>(null);
	let envoi = $state(false);

	const modalTitle = $derived(
		editing?.mode === 'edit' ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'
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
			Ajouter un fournisseur
		</button>
	{/if}
</div>

<NcFilterBar onapply={apply}>
	<label class="field">
		<span>Nom</span>
		<input
			type="text"
			placeholder="Nom de la ferme"
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
		<select value={String(pageSize)} onchange={changePageSize} aria-label="Fournisseurs par page">
			{#each pageSizeOptions as size (size)}
				<option value={String(size)}>{size} par page</option>
			{/each}
		</select>
	</label>
</div>

<div class="results">
	<DataTable
		{columns}
		rows={suppliers.data}
		rowKey={(s) => s.id}
		empty="Aucun fournisseur ne correspond aux filtres."
	>
		{#snippet row(s)}
			<td class="nom">{s.nom_ferme}</td>
			<td>{s.adresse_siege}</td>
			<td>{s.type_produit ?? '—'}</td>
			<td>{s.is_active ? 'Actif' : 'Archivé'}</td>
			{#if canManage}
				<td class="actions">
					<button
						type="button"
						class="link-btn"
						onclick={() => (editing = { mode: 'edit', supplier: s })}
					>
						Éditer
					</button>
					<form method="POST" action="?/toggleSupplier" use:enhance={onSave} class="inline">
						<input type="hidden" name="id" value={s.id} />
						<input type="hidden" name="active" value={String(!s.is_active)} />
						<button type="submit" class="link-btn">{s.is_active ? 'Archiver' : 'Réactiver'}</button>
					</form>
				</td>
			{/if}
		{/snippet}
	</DataTable>
</div>

<Pagination
	page={suppliers.pagination.page}
	totalPages={suppliers.pagination.totalPages}
	total={suppliers.pagination.total}
	unit="fournisseurs"
	hrefFor={hrefForPage}
/>

{#if !canManage && suppliers.pagination.total > 0}
	<ActionReservee action="La gestion des fournisseurs" {role} />
{/if}

<Modal open={editing !== null} title={modalTitle} onclose={() => (editing = null)}>
	{#if editing}
		<form
			method="POST"
			action={editing.mode === 'edit' ? '?/updateSupplier' : '?/createSupplier'}
			use:enhance={onSave}
			class="modal-form"
		>
			{#if form?.supplierError}
				<p class="err" role="alert">❌ {form.supplierError}</p>
			{/if}
			{#if editing.mode === 'edit'}
				<input type="hidden" name="id" value={editing.supplier.id} />
			{/if}

			<label>
				<span>Nom</span>
				<input
					name="nom_ferme"
					required
					minlength="2"
					maxlength="120"
					value={editing.mode === 'edit' ? editing.supplier.nom_ferme : ''}
				/>
			</label>

			<label>
				<span>Adresse du siège</span>
				<input
					name="adresse_siege"
					required
					minlength="2"
					maxlength="200"
					value={editing.mode === 'edit' ? editing.supplier.adresse_siege : ''}
				/>
			</label>

			<label>
				<span>Type de produit (facultatif)</span>
				<input
					name="type_produit"
					maxlength="120"
					placeholder="Ex. : Produits laitiers"
					value={editing.mode === 'edit' ? (editing.supplier.type_produit ?? '') : ''}
				/>
			</label>

			<label>
				<span>Contact qualité (facultatif)</span>
				<input
					name="contact_qualite"
					maxlength="120"
					value={editing.mode === 'edit' ? (editing.supplier.contact_qualite ?? '') : ''}
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

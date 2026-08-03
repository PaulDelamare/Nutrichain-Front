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
		productsSearchParams,
		productsPageSizeParams
	} from '$lib/utils/config/productsSearchParams';
	import { emptyProductFilters, type ProductFilters } from '$lib/types/product';
	import type { ApiProductComplet, ApiProductList } from '$lib/Api/organization.server';

	type ProductForm = {
		productError?: string;
		productCreated?: unknown;
		productUpdated?: unknown;
	} | null;

	type Props = {
		products: ApiProductList;
		filters: ProductFilters;
		pageSize: number;
		pageSizeOptions: number[];
		form?: ProductForm;
		role: KnownRole;
	};

	let {
		products,
		filters: dataFilters,
		pageSize,
		pageSizeOptions,
		form = null,
		role
	}: Props = $props();

	const canManage = $derived(peutAdministrer(role));

	// --- Filtres pilotés par l'URL (requête filtrée côté API) ---
	// eslint-disable-next-line svelte/prefer-writable-derived
	let filters = $state(emptyProductFilters());
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
		navigate(productsSearchParams($page.url.searchParams, filters));
	}

	async function applyImmediately() {
		applyDebounced.cancel();
		await tick();
		apply();
	}

	function changePageSize(event: Event) {
		const size = Number((event.currentTarget as HTMLSelectElement).value);
		navigate(productsPageSizeParams($page.url.searchParams, size));
	}

	const columns = $derived(
		canManage
			? ['Nom', 'GTIN', 'Catégorie', 'Statut', 'Actions']
			: ['Nom', 'GTIN', 'Catégorie', 'Statut']
	);

	// Modale partagée create / edit.
	type Editing = { mode: 'create' } | { mode: 'edit'; product: ApiProductComplet } | null;
	let editing = $state<Editing>(null);
	let envoi = $state(false);

	const modalTitle = $derived(
		editing?.mode === 'edit' ? 'Modifier le produit' : 'Ajouter un produit'
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

	const numValue = (v: string | number | null | undefined) =>
		v == null || v === '' ? '' : String(v);
</script>

<div class="topbar">
	{#if canManage}
		<button type="button" class="add" onclick={() => (editing = { mode: 'create' })}>
			Ajouter un produit
		</button>
	{/if}
</div>

<NcFilterBar onapply={apply}>
	<label class="field">
		<span>Nom</span>
		<input
			type="text"
			placeholder="Nom du produit"
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
		<select value={String(pageSize)} onchange={changePageSize} aria-label="Produits par page">
			{#each pageSizeOptions as size (size)}
				<option value={String(size)}>{size} par page</option>
			{/each}
		</select>
	</label>
</div>

<div class="results">
	<DataTable
		{columns}
		rows={products.data}
		rowKey={(p) => p.id}
		empty="Aucun produit ne correspond aux filtres."
	>
		{#snippet row(p)}
			<td class="nom">{p.nom}</td>
			<td class="mono">{p.code_gtin}</td>
			<td>{p.categorie}</td>
			<td>{p.is_active ? 'Actif' : 'Archivé'}</td>
			{#if canManage}
				<td class="actions">
					<button
						type="button"
						class="link-btn"
						onclick={() => (editing = { mode: 'edit', product: p })}
					>
						Éditer
					</button>
					<form method="POST" action="?/toggleProduct" use:enhance={onSave} class="inline">
						<input type="hidden" name="id" value={p.id} />
						<input type="hidden" name="active" value={String(!p.is_active)} />
						<button type="submit" class="link-btn">{p.is_active ? 'Archiver' : 'Réactiver'}</button>
					</form>
				</td>
			{/if}
		{/snippet}
	</DataTable>
</div>

<Pagination
	page={products.pagination.page}
	totalPages={products.pagination.totalPages}
	total={products.pagination.total}
	unit="produits"
	hrefFor={hrefForPage}
/>

{#if !canManage && products.pagination.total > 0}
	<ActionReservee action="La gestion des produits" {role} />
{/if}

<Modal open={editing !== null} title={modalTitle} onclose={() => (editing = null)}>
	{#if editing}
		<form
			method="POST"
			action={editing.mode === 'edit' ? '?/updateProduct' : '?/createProduct'}
			use:enhance={onSave}
			class="modal-form"
		>
			{#if form?.productError}
				<p class="err" role="alert">❌ {form.productError}</p>
			{/if}
			{#if editing.mode === 'edit'}
				<input type="hidden" name="id" value={editing.product.id} />
			{/if}

			<label>
				<span>Nom</span>
				<input
					name="nom"
					required
					minlength="2"
					maxlength="120"
					value={editing.mode === 'edit' ? editing.product.nom : ''}
				/>
			</label>

			{#if editing.mode === 'create'}
				<label>
					<span>Code GTIN (8 à 14 chiffres)</span>
					<input name="code_gtin" required inputmode="numeric" placeholder="Ex. : 3456789012345" />
				</label>
			{:else}
				<p class="ro">
					GTIN {editing.product.code_gtin} · unité {editing.product.unite_reference} — non modifiables
					(identité GS1).
				</p>
			{/if}

			<label>
				<span>Catégorie</span>
				<input
					name="categorie"
					required
					minlength="2"
					maxlength="80"
					value={editing.mode === 'edit' ? editing.product.categorie : ''}
				/>
			</label>

			{#if editing.mode === 'create'}
				<label>
					<span>Unité de référence (ex. KG)</span>
					<input name="unite_reference" required maxlength="20" />
				</label>
			{/if}

			<div class="row">
				<label>
					<span>Conservation (jours)</span>
					<input
						name="duree_conservation_defaut"
						type="number"
						min="0"
						max="3650"
						required
						value={editing.mode === 'edit'
							? numValue(editing.product.duree_conservation_defaut)
							: ''}
					/>
				</label>
				<label>
					<span>Seuil d'alerte stock</span>
					<input
						name="seuil_alerte_stock"
						type="number"
						min="0"
						step="0.01"
						required
						value={editing.mode === 'edit' ? numValue(editing.product.seuil_alerte_stock) : ''}
					/>
				</label>
			</div>

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

	.mono {
		font-family: ui-monospace, monospace;
		font-size: 0.8125rem;
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

	.modal-form .row {
		display: flex;
		gap: 0.75rem;
	}

	.modal-form .row label {
		flex: 1;
	}

	.modal-form input {
		padding: 0.5rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--nc-text);
	}

	.ro {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--nc-text-subtle);
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

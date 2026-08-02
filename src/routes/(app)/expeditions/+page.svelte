<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import ShipmentFilters from '$lib/components/expeditions/ShipmentFilters.svelte';
	import { pageHref } from '$lib/utils/pageSearch/pageHref';
	import {
		shipmentsPageSizeParams,
		shipmentsSearchParams
	} from '$lib/utils/shipments/shipmentsSearchParams';
	import { emptyShipmentFilters } from '$lib/types/shipment';
	import { peutEcrire } from '$lib/config/roles';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const canWrite = $derived(peutEcrire(data.user.role));

	const columns = $derived(
		canWrite
			? ['Référence', 'Client', 'Statut', 'Date envoi', 'Arrivée', 'Lots', 'Action']
			: ['Référence', 'Client', 'Statut', 'Date envoi', 'Arrivée', 'Lots']
	);

	// --- Filtres pilotés par l'URL (requête filtrée côté API) ---
	// eslint-disable-next-line svelte/prefer-writable-derived
	let filters = $state(emptyShipmentFilters());
	$effect(() => {
		filters = { ...data.filters };
	});

	const clientOptions = $derived([
		{ label: 'Tous les clients', value: 'tous' },
		...data.customers.map((c) => ({ label: c.nom_enseigne, value: c.id }))
	]);
	const statutOptions = [
		{ label: 'Tous les statuts', value: 'tous' },
		{ label: 'En route', value: 'EN_ROUTE' },
		{ label: 'Livré', value: 'LIVRE' }
	];

	/**
	 * Le tableau affichait le code de l'API tel quel (« EN_ROUTE »), alors que le filtre juste
	 * au-dessus proposait déjà « En route ». Un type inconnu retombe sur son code plutôt que de
	 * disparaître : mieux vaut un code lisible qu'une cellule vide.
	 */
	const libelleStatut = (statut: string) =>
		statutOptions.find((o) => o.value === statut)?.label ?? statut;

	const hrefForPage = $derived((target: number) =>
		pageHref(resolve('/expeditions'), $page.url.searchParams, target)
	);

	function navigate(params: URLSearchParams) {
		const qs = params.toString();
		if (qs === $page.url.searchParams.toString()) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/expeditions')}${qs ? `?${qs}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function apply() {
		navigate(shipmentsSearchParams($page.url.searchParams, filters));
	}

	function changePageSize(event: Event) {
		const size = Number((event.currentTarget as HTMLSelectElement).value);
		navigate(shipmentsPageSizeParams($page.url.searchParams, size));
	}

	// --- Modale d'ajout ---
	let addOpen = $state(false);
	let envoi = $state(false);

	const onCreate: SubmitFunction = () => {
		envoi = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				addOpen = false;
			} else {
				await update({ reset: false, invalidateAll: false });
			}
			envoi = false;
		};
	};

	/**
	 * Geste irréversible : la date d'arrivée est scellée dans le journal WORM et aucune route ne
	 * l'annule. Les boutons sont identiques d'une ligne à l'autre — sans ce garde-fou, un clic une
	 * ligne trop bas date définitivement la mauvaise expédition.
	 */
	function confirmDelivery(ref: string, event: SubmitEvent) {
		if (!confirm(`Constater l'arrivée de l'expédition ${ref} ? La date sera définitive.`)) {
			event.preventDefault();
		}
	}
</script>

<PageHead
	heading="Expéditions"
	description="Flux sortants — destination, statut de livraison, lots embarqués."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

{#if form?.created}
	<p class="feedback ok" role="status">Expédition créée — réf. {form.created.shipment_id}</p>
{/if}

{#if form?.confirmed}
	<p class="feedback ok" role="status">
		Livraison confirmée — réf. {form.confirmed.ref}, arrivée le {form.confirmed.date}
	</p>
{:else if form?.confirmError}
	<p class="feedback err" role="status">{form.confirmError}</p>
{/if}

{#if !data.error}
	<div class="topbar">
		{#if canWrite}
			<button type="button" class="add" onclick={() => (addOpen = true)}>
				Créer une expédition
			</button>
		{:else}
			<p class="hint">Réservé aux opérateurs, administrateurs et propriétaires.</p>
		{/if}
	</div>

	<ShipmentFilters bind:filters {clientOptions} {statutOptions} onapply={apply} />

	<div class="toolbar">
		<label class="page-size">
			<span>Afficher</span>
			<select
				value={String(data.pageSize)}
				onchange={changePageSize}
				aria-label="Expéditions par page"
			>
				{#each data.pageSizeOptions as size (size)}
					<option value={String(size)}>{size} par page</option>
				{/each}
			</select>
		</label>
	</div>

	<div class="results">
		<DataTable
			{columns}
			rows={data.shipments}
			rowKey={(r) => r.id}
			empty="Aucune expédition ne correspond aux filtres."
		>
			{#snippet row(r)}
				<td class="mono">{r.ref}</td>
				<td>{r.client}</td>
				<td>{libelleStatut(r.statut)}</td>
				<td>{r.date}</td>
				<!-- Une arrivée non constatée se dit, elle ne se devine pas. -->
				<td>{r.deliveredAt ?? 'non constatée'}</td>
				<td>{r.lots}</td>
				{#if canWrite}
					<td>
						{#if !r.deliveredAt}
							<form method="POST" action="?/confirm" onsubmit={(e) => confirmDelivery(r.ref, e)}>
								<input type="hidden" name="id" value={r.id} />
								<button type="submit" class="confirm-delivery">Confirmer la livraison</button>
							</form>
						{:else}
							<span class="muted">—</span>
						{/if}
					</td>
				{/if}
			{/snippet}
		</DataTable>
	</div>

	<Pagination
		page={data.pagination.page}
		totalPages={data.pagination.totalPages}
		total={data.pagination.total}
		unit="expéditions"
		hrefFor={hrefForPage}
	/>
{/if}

<Modal open={addOpen} title="Créer une expédition" onclose={() => (addOpen = false)}>
	<form method="POST" action="?/create" use:enhance={onCreate} class="modal-form">
		{#if form?.createError}
			<p class="err" role="alert">❌ {form.createError}</p>
		{/if}

		<label>
			<span>Client</span>
			<select name="id_client" required>
				<option value="">—</option>
				{#each data.customers as c (c.id)}
					<option value={c.id}>{c.nom_enseigne}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Référence (AUTO = SSCC serveur)</span>
			<input name="shipment_id" maxlength="100" placeholder="AUTO" value="AUTO" />
		</label>

		<label>
			<span>Transporteur</span>
			<input name="transporteur" required minlength="2" maxlength="100" />
		</label>

		<label>
			<span>Adresse de destination</span>
			<input
				name="destination_adresse"
				required
				minlength="5"
				maxlength="255"
				placeholder="Adresse de livraison"
			/>
		</label>

		<label>
			<span>Lot à expédier</span>
			<select name="id_lot" required>
				<option value="">—</option>
				{#each data.lots as lot (lot.id)}
					<option value={lot.id}>{lot.label}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Quantité</span>
			<input name="quantite_expediee" type="number" step="any" min="0.01" required />
		</label>

		<button type="submit" class="submit" disabled={envoi}>Expédier</button>
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
		padding: 0.625rem 0.875rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.feedback.ok {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.feedback.err {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}

	.topbar {
		display: flex;
		justify-content: flex-end;
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

	.mono {
		font-variant-numeric: tabular-nums;
	}

	.confirm-delivery {
		padding: 0.3rem 0.55rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}

	.confirm-delivery:hover {
		background: var(--nc-brand-hover);
	}

	.muted {
		color: var(--nc-text-muted);
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

	.err {
		margin: 0;
		font-size: 0.8125rem;
		color: #b91c1c;
	}
</style>

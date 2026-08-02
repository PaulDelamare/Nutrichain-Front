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
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import RecallResult from '$lib/components/recall/RecallResult.svelte';
	import RecallStatusBadge from '$lib/components/recall/RecallStatusBadge.svelte';
	import RecallFilters from '$lib/components/recall/RecallFilters.svelte';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';
	import { peutDeciderQualite } from '$lib/config/roles';
	import { libelleLotRappel } from '$lib/utils/lots/lotLabel';
	import { pageHref } from '$lib/utils/pageSearch/pageHref';
	import {
		recallsSearchParams,
		recallsPageSizeParams
	} from '$lib/utils/recall/recallsSearchParams';
	import { emptyRecallFilters } from '$lib/types/recall';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const canTrigger = $derived(peutDeciderQualite(data.user.role));

	const lotOptions = $derived(
		data.batches.map((b) => ({ value: b.id, label: libelleLotRappel(b) }))
	);

	const columns = ['Réf', 'Motif', 'Lots', 'Expéditions', 'Statut', 'Étape'];

	// --- Filtres pilotés par l'URL (requête filtrée côté API) ---
	// eslint-disable-next-line svelte/prefer-writable-derived
	let filters = $state(emptyRecallFilters());
	$effect(() => {
		filters = { ...data.filters };
	});

	const hrefForPage = $derived((target: number) =>
		pageHref(resolve('/rappels-produits'), $page.url.searchParams, target)
	);

	function navigate(params: URLSearchParams) {
		const qs = params.toString();
		if (qs === $page.url.searchParams.toString()) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/rappels-produits')}${qs ? `?${qs}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function apply() {
		navigate(recallsSearchParams($page.url.searchParams, filters));
	}

	function changePageSize(event: Event) {
		const size = Number((event.currentTarget as HTMLSelectElement).value);
		navigate(recallsPageSizeParams($page.url.searchParams, size));
	}

	// --- Modale de déclenchement ---
	let triggerOpen = $state(false);
	let envoi = $state(false);

	const onTrigger: SubmitFunction = () => {
		envoi = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				triggerOpen = false;
			} else {
				await update({ reset: false, invalidateAll: false });
			}
			envoi = false;
		};
	};
</script>

<PageHead
	heading="Rappels produits"
	description="Workflow — lots concernés, expéditions impactées, état du rappel."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

{#if form?.recall}
	<div class="result">
		<RecallResult recall={form.recall} />
	</div>
{/if}

<div class="topbar">
	{#if canTrigger}
		<button type="button" class="add" onclick={() => (triggerOpen = true)}>
			Déclencher un rappel
		</button>
	{:else}
		<ActionReservee action="Le déclenchement d'un rappel produit" role={data.user.role} />
	{/if}
</div>

{#if data.lotsSousRappel.length > 0}
	<section class="immobilises">
		<h2>Marchandise immobilisée ({data.lotsSousRappel.length})</h2>
		<p class="immobilises-hint">
			Ces lots sont au statut « alerte » : ils ne peuvent être ni transformés ni expédiés. Résoudre
			l'alerte d'un rappel ne les libère pas — c'est l'état des lots qui fait foi.
		</p>
		<ul>
			{#each data.lotsSousRappel as lot (lot.id)}
				<li>
					<a href={resolve('/(app)/fiche-lot/[lotId]', { lotId: lot.id })}
						>{libelleLotRappel(lot)}</a
					>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<RecallFilters bind:filters onapply={apply} />

<div class="toolbar">
	<label class="page-size">
		<span>Afficher</span>
		<select value={String(data.pageSize)} onchange={changePageSize} aria-label="Rappels par page">
			{#each data.pageSizeOptions as size (size)}
				<option value={String(size)}>{size} par page</option>
			{/each}
		</select>
	</label>
</div>

<div class="results">
	<DataTable
		{columns}
		rows={data.rappels}
		rowKey={(r) => r.id}
		empty="Aucun rappel produit ne correspond aux filtres."
	>
		{#snippet row(r)}
			<td class="mono">{r.id}</td>
			<td class="motif">{r.produit}</td>
			<td>{r.lots}</td>
			<td>{r.sites}</td>
			<td><RecallStatusBadge statut={r.statut} /></td>
			<td>{r.etape}</td>
		{/snippet}
	</DataTable>
</div>

<Pagination
	page={data.pagination.page}
	totalPages={data.pagination.totalPages}
	total={data.pagination.total}
	unit="rappels"
	hrefFor={hrefForPage}
/>

<Modal open={triggerOpen} title="Déclencher un rappel" onclose={() => (triggerOpen = false)}>
	<form method="POST" action="?/recall" use:enhance={onTrigger} class="modal-form">
		{#if form?.error}
			<p class="err" role="alert">❌ {form.error}</p>
		{/if}

		<p class="hint">
			Bloque le lot et toute sa descendance (transformations incluses), liste les expéditions déjà
			parties et notifie automatiquement l'équipe et les clients livrés.
		</p>

		<label>
			<span>Lot concerné</span>
			<SearchSelect name="lotId" options={lotOptions} placeholder="— choisir un lot —" />
		</label>

		<label>
			<span>Motif du rappel</span>
			<input
				type="text"
				name="reason"
				placeholder="Ex. : suspicion de contamination Listeria"
				value={form?.reason ?? ''}
				required
			/>
		</label>

		<button type="submit" class="submit" disabled={envoi}>Déclencher le rappel</button>
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

	.result {
		margin: 0 0 1rem;
	}

	/* Bouton d'action à GAUCHE (et non à droite comme les autres listings) : demandé ici pour
	   rapprocher l'appel à l'action du début de lecture de la page. */
	.topbar {
		display: flex;
		justify-content: flex-start;
		margin-bottom: 1rem;
	}

	/* Rouge : déclencher un rappel est un geste critique et irréversible (blocage WORM). */
	.add {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: #b91c1c;
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.add:hover {
		background: #991b1b;
	}

	/* Panneau autoritaire (cf. #122) : l'état qui fait foi est celui des LOTS, pas des alertes. */
	.immobilises {
		margin-bottom: 1rem;
		padding: 0.9rem 1.1rem;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		background: #fef2f2;
	}

	.immobilises h2 {
		margin: 0 0 0.2rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.immobilises-hint {
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.immobilises ul {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.875rem;
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

	.motif {
		color: var(--nc-text);
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

	.hint {
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
		background: #b91c1c;
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.submit:hover {
		background: #991b1b;
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

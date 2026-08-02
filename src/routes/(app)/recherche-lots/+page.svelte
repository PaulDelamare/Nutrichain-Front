<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import LotFilters from '$lib/components/lots/LotFilters.svelte';
	import LotTable from '$lib/components/lots/LotTable.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { BATCH_STATUSES, batchStatusLabel } from '$lib/vocab/batchStatus';
	import { pageHref } from '$lib/utils/pageSearch/pageHref';
	import { schedulePageSearchNavigation } from '$lib/utils/pageSearch/syncToUrl';
	import { lotsPageSizeParams, lotsSearchParams } from '$lib/utils/lots/lotsSearchParams';
	import { emptyLotFilters } from '$lib/types/lot';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher lot, GTIN, produit, site…');
		return () => pageSearch.deactivate();
	});

	$effect(() => {
		const urlQ = $page.url.searchParams.get('q') ?? '';
		if (pageSearch.query !== urlQ) pageSearch.query = urlQ;
	});

	$effect(() => {
		const q = pageSearch.query;
		return schedulePageSearchNavigation(
			resolve('/recherche-lots'),
			$page.url.searchParams,
			'q',
			q,
			{
				resetParams: ['page']
			}
		);
	});

	const hrefForPage = $derived((target: number) =>
		pageHref(resolve('/recherche-lots'), $page.url.searchParams, target)
	);

	// Les filtres (et la taille de page) vivent désormais dans l'URL : la requête part filtrée à
	// l'API, sur TOUTE l'organisation. L'effet réaligne les champs sur l'URL après chaque navigation
	// (retour arrière, lien filtré chargé côté client). Un $state (et non un $derived) car le panneau
	// mute des propriétés via bind:filters, ce qu'un derived n'accepterait pas.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let filters = $state(emptyLotFilters());
	$effect(() => {
		filters = { ...data.filters };
	});

	const produitOptions = $derived([
		{ label: 'Tous les produits', value: 'tous' },
		...data.produitOptions
	]);
	const siteOptions = $derived([{ label: 'Tous les sites', value: 'tous' }, ...data.siteOptions]);
	const statutOptions = [
		{ label: 'Tous les statuts', value: 'tous' },
		...Object.values(BATCH_STATUSES).map((s) => ({ label: batchStatusLabel(s), value: s }))
	];

	// La construction des query params vit dans un util testable ; ici on ne fait que naviguer.
	function navigate(params: URLSearchParams) {
		const qs = params.toString();
		if (qs === $page.url.searchParams.toString()) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/recherche-lots')}${qs ? `?${qs}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function apply() {
		navigate(lotsSearchParams($page.url.searchParams, filters));
	}

	function changePageSize(event: Event) {
		const size = Number((event.currentTarget as HTMLSelectElement).value);
		navigate(lotsPageSizeParams($page.url.searchParams, size));
	}
</script>

<PageHead
	heading="Recherche de lots"
	description="Filtres — numéro de lot, produit, GTIN, site et statut."
/>

{#if data.error}
	<p class="warn">API indisponible — {data.error}</p>
{/if}

{#if !data.error}
	<LotFilters bind:filters {produitOptions} {siteOptions} {statutOptions} onapply={apply} />

	<div class="toolbar">
		<label class="page-size">
			<span>Afficher</span>
			<select value={String(data.pageSize)} onchange={changePageSize} aria-label="Lots par page">
				{#each data.pageSizeOptions as size (size)}
					<option value={String(size)}>{size} par page</option>
				{/each}
			</select>
		</label>
	</div>

	<div class="results">
		<LotTable rows={data.lots} />
	</div>

	<Pagination
		page={data.pagination.page}
		totalPages={data.pagination.totalPages}
		total={data.pagination.total}
		unit="lots"
		hrefFor={hrefForPage}
	/>
{/if}

<style>
	.warn {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fef9c3;
		color: #854d0e;
		font-size: 0.8125rem;
	}

	.toolbar {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
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

	.results {
		margin-top: 0.75rem;
	}
</style>

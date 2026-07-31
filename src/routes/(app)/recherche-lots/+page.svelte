<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import LotFilters from '$lib/components/lots/LotFilters.svelte';
	import LotTable from '$lib/components/lots/LotTable.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { emptyLotFilters } from '$lib/types/lot';
	import { filterLots } from '$lib/utils/lots/filterLots';
	import { pageHref } from '$lib/utils/pageSearch/pageHref';
	import { schedulePageSearchNavigation } from '$lib/utils/pageSearch/syncToUrl';
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
			{ resetParams: ['page'] }
		);
	});

	const hrefForPage = $derived((target: number) =>
		pageHref(resolve('/recherche-lots'), $page.url.searchParams, target)
	);

	let draft = $state(emptyLotFilters());
	let applied = $state(emptyLotFilters());

	const produitOptions = $derived([
		{ label: 'Tous les produits', value: 'tous' },
		...Array.from(new Set(data.lots.map((l) => l.produit)))
			.sort()
			.map((p) => ({ label: p, value: p }))
	]);
	const siteOptions = $derived([
		{ label: 'Tous les sites', value: 'tous' },
		...Array.from(new Set(data.lots.map((l) => l.site).filter((s) => s && s !== '—')))
			.sort()
			.map((s) => ({ label: s, value: s }))
	]);

	const results = $derived(filterLots(data.lots, applied));

	function apply() {
		applied = { ...draft };
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
	<LotFilters bind:filters={draft} {produitOptions} {siteOptions} onapply={apply} />

	<div class="results">
		<LotTable rows={results} />
	</div>

	<Pagination
		page={data.pagination.page}
		totalPages={data.pagination.totalPages}
		total={data.pagination.total}
		unit="lots"
		hrefFor={hrefForPage}
	/>

	<!-- Les filtres du panneau s'appliquent à la page affichée, pas au catalogue : le dire évite
	     de conclure qu'un lot n'existe pas alors qu'il est deux pages plus loin. -->
	{#if data.pagination.totalPages > 1}
		<p class="note">
			Les filtres ci-dessus portent sur les lots de cette page. Pour chercher dans tout le
			catalogue, utilisez la barre de recherche en haut.
		</p>
	{/if}
{/if}

<style>
	.note {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #f0f9ff;
		color: #0369a1;
		font-size: 0.8125rem;
	}

	.warn {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fef9c3;
		color: #854d0e;
		font-size: 0.8125rem;
	}

	.results {
		margin-top: 1rem;
	}
</style>

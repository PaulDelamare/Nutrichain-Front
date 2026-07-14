<script lang="ts">
	import { page } from '$app/stores';
	import LotFilters from '$lib/components/lots/LotFilters.svelte';
	import LotTable from '$lib/components/lots/LotTable.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { emptyLotFilters } from '$lib/types/lot';
	import { filterLots } from '$lib/utils/lots/filterLots';
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
		return schedulePageSearchNavigation($page.url.pathname, $page.url.searchParams, 'q', q);
	});

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
	description="Filtres — GTIN, numéro de lot, produit, site et statut."
/>

{#if data.cappedAt100}
	<p class="note">
		Affichage limité aux 100 lots les plus récents. Utilisez la recherche (barre en haut) pour
		retrouver un lot plus ancien.
	</p>
{/if}

{#if data.error}
	<p class="warn">API indisponible — {data.error}</p>
{/if}

{#if !data.error}
	<LotFilters bind:filters={draft} {produitOptions} {siteOptions} onapply={apply} />

	<div class="results">
		<LotTable rows={results} />
	</div>
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

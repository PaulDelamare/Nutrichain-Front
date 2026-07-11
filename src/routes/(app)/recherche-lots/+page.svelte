<script lang="ts">
	import LotFilters from '$lib/components/lots/LotFilters.svelte';
	import LotTable from '$lib/components/lots/LotTable.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { emptyLotFilters } from '$lib/types/lot';
	import { filterLots } from '$lib/utils/lots/filterLots';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher lot, GTIN, produit, site…');
		return () => pageSearch.deactivate();
	});

	let draft = $state(emptyLotFilters());
	let applied = $state(emptyLotFilters());

	// Options de produits dérivées des lots réellement chargés (pas de valeurs codées en dur).
	const produitOptions = $derived([
		{ label: 'Tous les produits', value: 'tous' },
		...Array.from(new Set(data.lots.map((l) => l.produit)))
			.sort()
			.map((p) => ({ label: p, value: p }))
	]);

	const filteredByForm = $derived(filterLots(data.lots, applied));
	const results = $derived(
		filterRowsByText(filteredByForm, pageSearch.query, (row) => [
			row.lotNumber ?? row.id,
			row.produit,
			row.gtin,
			row.statut
		])
	);

	function apply() {
		applied = { ...draft };
	}
</script>

<PageHead
	heading="Recherche de lots"
	description="Filtres — GTIN, numéro de lot, produit et statut."
/>

{#if data.source === 'mock' && data.error}
	<p class="warn">API indisponible — données de démonstration ({data.error})</p>
{/if}

<LotFilters bind:filters={draft} {produitOptions} onapply={apply} />

<div class="results">
	<LotTable rows={results} />
</div>

<style>
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

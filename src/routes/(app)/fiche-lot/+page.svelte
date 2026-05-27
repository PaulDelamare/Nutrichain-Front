<script lang="ts">
	import LotTable from '$lib/components/lots/LotTable.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Filtrer les lots à ouvrir…');
		return () => pageSearch.deactivate();
	});

	const lots = $derived(
		filterRowsByText(data.lots, pageSearch.query, (row) => [
			row.id,
			row.produit,
			row.gtin,
			row.site,
			row.statut
		])
	);
</script>

<PageHead
	heading="Fiches lot"
	description="Sélectionnez un lot pour afficher sa fiche détaillée (produit, traçabilité, localisation)."
/>

{#if data.source === 'mock' && data.error}
	<p class="warn">API indisponible — lots de démonstration ({data.error})</p>
{/if}

<p class="hint">Cliquez sur un lot pour ouvrir sa fiche unique.</p>

<LotTable rows={lots} />

<style>
	.warn,
	.hint {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
	}

	.warn {
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fef9c3;
		color: #854d0e;
	}

	.hint {
		color: #64748b;
	}
</style>

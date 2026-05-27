<script lang="ts">
	import IdentityCard from '$lib/components/lot-sheet/IdentityCard.svelte';
	import HistoryPanel from '$lib/components/lot-sheet/HistoryPanel.svelte';
	import LocationPanel from '$lib/components/lot-sheet/LocationPanel.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher dans l’historique du lot…');
		return () => pageSearch.deactivate();
	});

	const events = $derived(
		filterRowsByText(data.sheet.events, pageSearch.query, (e) => [
			e.time,
			e.day,
			e.title,
			e.detail
		])
	);
</script>

<PageHead
	heading="Fiche lot {data.sheet.id}"
	description="Produit, dates, statut, historique, température, évènements EPCIS, localisation."
/>

<p class="source">Données en direct depuis la base NutriChain.</p>

<div class="layout">
	<div class="main">
		<IdentityCard sheet={data.sheet} />
		<HistoryPanel {events} temperature={data.sheet.temperature} />
	</div>
	<LocationPanel sheet={data.sheet} />
</div>

<style>
	.source {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.layout {
		display: grid;
		grid-template-columns: 1fr minmax(14rem, 18rem);
		gap: 1rem;
		align-items: start;
	}

	.main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>

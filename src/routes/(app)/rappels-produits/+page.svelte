<script lang="ts">
	import RecallCard from '$lib/components/recall/RecallCard.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher rappel, produit, lot…');
		return () => pageSearch.deactivate();
	});

	const rappels = $derived(
		filterRowsByText(data.rappels, pageSearch.query, (r) => [
			r.id,
			r.produit,
			r.lots,
			r.sites,
			r.statut
		])
	);

	function notify() {
		// branchement notification à prévoir
	}
</script>

<PageHead
	heading="Rappels produits"
	description="Workflow — lots concernés, sites impactés, progression des retraits."
/>

{#if data.source === 'api'}
	<p class="source">Données issues des alertes actives en base.</p>
{/if}

<div class="list">
	{#each rappels as recall}
		<RecallCard {recall} onnotify={notify} />
	{/each}
</div>

<style>
	.source {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>

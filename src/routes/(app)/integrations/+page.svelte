<script lang="ts">
	import ConnectorCard from '$lib/components/integration/ConnectorCard.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher connecteur, flux…');
		return () => pageSearch.deactivate();
	});

	const connectors = $derived(
		filterRowsByText(data.connectors, pageSearch.query, (c) => [
			c.name,
			c.statut,
			...c.lines
		])
	);
</script>

<PageHead
	heading="Intégrations ERP / WMS / TMS"
	description="Connecteurs, états de synchronisation et files d'attente."
/>

{#if data.source === 'mock'}
	<p class="banner">Connecteurs partiellement dérivés du journal d'audit — pas de modèle dédié en base.</p>
{/if}

<div class="grid">
	{#each connectors as connector}
		<ConnectorCard {connector} />
	{/each}
</div>

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #f8fafc;
		color: var(--nc-text-muted);
		font-size: 0.8125rem;
		border: 1px solid #e2e8f0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}

	@media (max-width: 1000px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>

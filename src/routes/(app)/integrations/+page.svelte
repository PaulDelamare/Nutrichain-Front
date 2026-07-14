<script lang="ts">
	import ConnectorCard from '$lib/components/integration/ConnectorCard.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Placeholder from '$lib/components/page/Placeholder.svelte';
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
		filterRowsByText(data.connectors, pageSearch.query, (c) => [c.name, c.statut, ...c.lines])
	);
</script>

<PageHead
	heading="Intégrations ERP / WMS / TMS"
	description="Connecteurs, états de synchronisation et files d'attente."
/>

{#if connectors.length > 0}
	<div class="grid">
		{#each connectors as connector (connector.name)}
			<ConnectorCard {connector} />
		{/each}
	</div>
{:else}
	<Placeholder
		message="Aucun connecteur configuré. Les flux ERP / WMS / TMS ne sont pas encore branchés."
	/>
{/if}

<style>
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

<script lang="ts">
	import PageHead from '$lib/components/page/PageHead.svelte';
	import TraceTree from '$lib/components/trace/TraceTree.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher étape, produit, fournisseur…');
		return () => pageSearch.deactivate();
	});

	const steps = $derived(
		filterRowsByText(data.steps, pageSearch.query, (s) => [
			s.phase,
			s.title,
			s.detail,
			s.badge?.label
		])
	);
</script>

<PageHead
	heading="Arbre de traçabilité"
	description="Vue amont / aval — matières premières vers produits finis et expéditions."
/>

{#if data.source === 'mock'}
	<p class="banner">Données de démonstration — connectez l’API pour la traçabilité réelle.</p>
{/if}

<TraceTree {steps} />

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}
</style>

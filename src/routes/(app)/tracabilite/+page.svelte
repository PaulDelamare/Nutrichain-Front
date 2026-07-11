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
		data.steps
			? filterRowsByText(data.steps, pageSearch.query, (s) => [
					s.phase,
					s.title,
					s.detail,
					s.badge?.label
				])
			: []
	);
</script>

<PageHead
	heading="Arbre de traçabilité"
	description="Vue amont / aval — matières premières vers produits finis et expéditions."
/>

{#if data.source === 'mock'}
	<p class="banner">Données de démonstration — connectez l'API pour la traçabilité réelle.</p>
{/if}

<form method="GET" class="picker">
	<label for="lot">Lot à tracer</label>
	<select id="lot" name="lot" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
		<option value="" disabled selected={!data.lotId}>— choisir un lot —</option>
		{#each data.batches as batch (batch.id)}
			<option value={batch.id} selected={batch.id === data.lotId}>
				{batch.nom} — {batch.id.slice(0, 8)}… ({batch.statut})
			</option>
		{/each}
	</select>
</form>

{#if data.steps}
	<TraceTree {steps} />
{:else}
	<p class="empty">Sélectionnez un lot ci-dessus pour afficher sa traçabilité amont / aval.</p>
{/if}

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		max-width: 30rem;
		margin: 0 0 1.25rem;
	}

	.picker label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nc-text);
	}

	.picker select {
		padding: 0.5rem 0.625rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: #fff;
	}

	.empty {
		padding: 1.5rem;
		border: 1px dashed #cbd5e1;
		border-radius: 0.5rem;
		color: var(--nc-text-muted);
		font-size: 0.875rem;
		text-align: center;
	}
</style>

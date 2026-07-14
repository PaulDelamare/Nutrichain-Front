<script lang="ts">
	import PageHead from '$lib/components/page/PageHead.svelte';
	import TraceGenealogy from '$lib/components/trace/TraceGenealogy.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let picker = $state<HTMLFormElement>();

	const lotOptions = $derived(
		data.batches.map((b) => ({
			value: b.id,
			label: `${b.nom} — ${b.lotNumber} (${b.statut})`
		}))
	);
</script>

<PageHead
	heading="Arbre de traçabilité"
	description="Retrouvez l'origine (amont) et la descendance (aval) d'un lot : d'où viennent ses matières, et quels produits en sont issus."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

<form method="GET" class="picker" bind:this={picker}>
	<span class="picker-label">Lot à tracer</span>
	<SearchSelect
		name="lot"
		options={lotOptions}
		value={data.lotId ?? ''}
		placeholder="— choisir un lot —"
		onchange={() => picker?.requestSubmit()}
	/>
</form>

{#if data.genealogyError}
	<p class="banner err">Impossible de charger la généalogie — {data.genealogyError}</p>
{:else if data.graph}
	<TraceGenealogy graph={data.graph} />
{:else}
	<p class="empty">Sélectionnez un lot ci-dessus pour afficher sa traçabilité amont / aval.</p>
{/if}

<style>
	.banner.err {
		background: #fef2f2;
		color: #991b1b;
	}

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
		margin: 0 0 1.5rem;
	}

	.picker-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nc-text);
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

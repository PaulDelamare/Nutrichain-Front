<script lang="ts">
	import LotLocationMap from '$lib/components/lot-sheet/LotLocationMap.svelte';
	import type { LotSheet } from '$lib/types/lot-sheet';

	type Props = {
		sheet: LotSheet;
	};

	let { sheet }: Props = $props();
</script>

<section class="card">
	<h3>Localisation</h3>
	<p class="site">{sheet.site}</p>
	<p class="zone">{sheet.zone}</p>

	{#key sheet.id}
		<LotLocationMap pin={sheet.mapPin} lotId={sheet.id} />
	{/key}

	<p class="sync">Enregistré le : {sheet.createdAtLabel}</p>
</section>

<style>
	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.card h3 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.site {
		margin: 0 0 0.25rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.zone {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.sync {
		margin: 0.75rem 0 0;
		font-size: 0.75rem;
		color: var(--nc-text-subtle);
	}
</style>

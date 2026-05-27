<script lang="ts">
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

	<div class="map">Carte site (schéma)</div>

	<p class="sync">Dernière synchro WMS : {sheet.wmsSync}</p>
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
		color: #0f172a;
	}

	.site {
		margin: 0 0 0.25rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #0f172a;
	}

	.zone {
		margin: 0 0 1rem;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.map {
		flex: 1;
		display: grid;
		place-items: center;
		min-height: 8rem;
		margin-bottom: 1rem;
		border: 1px dashed #cbd5e1;
		border-radius: 0.375rem;
		background: #f0f9ff;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.sync {
		margin: 0;
		font-size: 0.75rem;
		color: #94a3b8;
	}
</style>

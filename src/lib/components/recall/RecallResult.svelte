<script lang="ts">
	import type { ApiRecallResult } from '$lib/Api/traceability.server';
	import AffectedShipmentList from './AffectedShipmentList.svelte';

	type Props = {
		recall: ApiRecallResult;
	};

	let { recall }: Props = $props();

	const lots = $derived(recall.blockedBatchesCount);
	const expeditions = $derived(recall.affectedShipments.length);
</script>

<div class="result" role="status">
	<p class="result-head">
		✅ Rappel exécuté — <strong>{lots}</strong>
		lot{lots > 1 ? 's' : ''} bloqué{lots > 1 ? 's' : ''} ·
		<strong>{expeditions}</strong>
		expédition{expeditions > 1 ? 's' : ''} impactée{expeditions > 1 ? 's' : ''}
	</p>

	{#if recall.depthSaturated}
		<p class="saturation" role="alert">
			⚠️ Attention — la descendance bloquée peut être incomplète (profondeur de graphe saturée).
			Vérifiez manuellement les lots liés.
		</p>
	{/if}

	<AffectedShipmentList shipments={recall.affectedShipments} />
</div>

<style>
	.result {
		margin-top: 1rem;
		padding: 0.875rem 1rem;
		border: 1px solid #bbf7d0;
		border-radius: 0.5rem;
		background: #f0fdf4;
	}

	.result-head {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		color: var(--nc-text);
	}

	.saturation {
		margin: 0 0 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

	/* L'habillage de la liste des magasins vit désormais dans `AffectedShipmentList`. */
</style>

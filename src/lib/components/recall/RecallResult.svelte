<script lang="ts">
	import type { ApiRecallResult } from '$lib/Api/traceability.server';

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

	{#if expeditions > 0}
		<p class="shipments-label">Magasins / expéditions touchés</p>
		<ul class="shipments">
			{#each recall.affectedShipments as shipment (shipment.shipmentId)}
				<li>
					<strong>{shipment.customerName}</strong>
					— {shipment.shipmentRef}
					({shipment.statutLivraison}) · {shipment.batchIds.length}
					lot{shipment.batchIds.length > 1 ? 's' : ''} · transporteur {shipment.transporteur}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="no-shipment">Aucune expédition déjà partie ne contient ces lots.</p>
	{/if}
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

	.shipments-label {
		margin: 0 0 0.35rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.shipments {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.shipments li {
		margin-bottom: 0.25rem;
	}

	.no-shipment {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}
</style>

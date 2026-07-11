<script lang="ts">
	import RecallCard from '$lib/components/recall/RecallCard.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

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
</script>

<PageHead
	heading="Rappels produits"
	description="Workflow — lots concernés, sites impactés, progression des retraits."
/>

{#if data.source === 'api'}
	<p class="source">Données issues des alertes actives en base.</p>
{/if}

<section class="trigger-card">
	<h3>Déclencher un rappel</h3>
	<p class="trigger-hint">
		Bloque le lot et toute sa descendance (transformations incluses), liste les expéditions déjà
		parties et notifie automatiquement l'équipe et les clients livrés.
	</p>

	<form method="POST" action="?/recall">
		<label>
			<span>Lot concerné</span>
			<select name="lotId" required>
				<option value="" disabled selected>— choisir un lot —</option>
				{#each data.batches as batch (batch.id)}
					<option value={batch.id}>
						{batch.produit?.nom ?? 'Produit'} — {batch.id.slice(0, 8)}… ({batch.statut})
					</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Motif du rappel</span>
			<input
				type="text"
				name="reason"
				placeholder="Ex. : suspicion de contamination Listeria"
				value={form?.reason ?? ''}
				required
			/>
		</label>

		<button type="submit">Déclencher le rappel</button>
	</form>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	{#if form?.recall}
		<div class="result" role="status">
			<p class="result-head">
				✅ Rappel exécuté — <strong>{form.recall.blockedBatchesCount}</strong>
				lot{form.recall.blockedBatchesCount > 1 ? 's' : ''} bloqué{form.recall.blockedBatchesCount >
				1
					? 's'
					: ''}
				· <strong>{form.recall.affectedShipments.length}</strong> expédition{form.recall
					.affectedShipments.length > 1
					? 's'
					: ''} impactée{form.recall.affectedShipments.length > 1 ? 's' : ''}
			</p>

			{#if form.recall.affectedShipments.length > 0}
				<ul class="shipments">
					{#each form.recall.affectedShipments as shipment (shipment.shipmentId)}
						<li>
							<strong>{shipment.shipmentRef}</strong> — {shipment.customerName}
							({shipment.statutLivraison}) · {shipment.batchIds.length}
							lot{shipment.batchIds.length > 1 ? 's' : ''} · transporteur {shipment.transporteur}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="no-shipment">Aucune expédition déjà partie ne contient ces lots.</p>
			{/if}
		</div>
	{/if}
</section>

<div class="list">
	{#each rappels as recall (recall.id)}
		<RecallCard {recall} />
	{/each}
</div>

<style>
	.source {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.trigger-card {
		max-width: 40rem;
		margin: 0 0 1.25rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.trigger-card h3 {
		margin: 0 0 0.35rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.trigger-hint {
		margin: 0 0 1rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--nc-text);
	}

	select,
	input {
		padding: 0.5rem 0.625rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: #fff;
	}

	button {
		align-self: flex-start;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: #b91c1c;
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	button:hover {
		background: #991b1b;
	}

	.error {
		margin: 0.75rem 0 0;
		font-size: 0.875rem;
		color: #b91c1c;
	}

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

	.list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>

<script lang="ts">
	import RecallCard from '$lib/components/recall/RecallCard.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Placeholder from '$lib/components/page/Placeholder.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';
	import { peutDeciderQualite } from '$lib/config/roles';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const lotOptions = $derived(
		data.batches.map((b) => ({
			value: b.id,
			label: `${b.produit?.nom ?? 'Produit'} — ${b.id.slice(0, 8)}… (${b.statut})`
		}))
	);

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
	description="Workflow — lots concernés, expéditions impactées, état du rappel."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

<section class="trigger-card">
	<h3>Déclencher un rappel</h3>
	<p class="trigger-hint">
		Bloque le lot et toute sa descendance (transformations incluses), liste les expéditions déjà
		parties et notifie automatiquement l'équipe et les clients livrés.
	</p>

	{#if peutDeciderQualite(data.user.role)}
		<form method="POST" action="?/recall">
			<label>
				<span>Lot concerné</span>
				<SearchSelect name="lotId" options={lotOptions} placeholder="— choisir un lot —" />
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
	{:else}
		<ActionReservee action="Le déclenchement d'un rappel produit" role={data.user.role} />
	{/if}

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

			{#if form.recall.depthSaturated}
				<p class="saturation" role="alert">
					⚠️ Attention — la descendance bloquée peut être incomplète (profondeur de graphe
					saturée). Vérifiez manuellement les lots liés.
				</p>
			{/if}

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

{#if rappels.length > 0}
	<div class="list">
		{#each rappels as recall (recall.id)}
			<RecallCard {recall} />
		{/each}
	</div>
{:else if !data.error}
	<Placeholder message="Aucun rappel produit en cours." />
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

	.trigger-card {
		margin: 0 0 1.25rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.trigger-card form {
		max-width: 40rem;
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

	.saturation {
		margin: 0 0 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
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
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(24rem, 1fr));
		gap: 1rem;
		align-items: start;
	}
</style>

<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import AffectedShipmentList from '$lib/components/recall/AffectedShipmentList.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let lotId = $state('');
	let submitting = $state(false);

	const lotOptions = $derived(data.lots.map((l) => ({ value: l.id, label: l.label })));

	// Le lot source est nommé comme dans le sélecteur : l'opérateur relit exactement ce qu'il a choisi.
	const sourceProduit = $derived(
		data.lots.find((l) => l.id === (form?.simulated ? form.sourceLotId : lotId))?.label ?? '—'
	);

	// Le compte vient de l'API, qui applique la règle du rappel lui-même. Le dériver de la
	// généalogie affichée — comme le faisait `downstream.length + 1` — le plafonnait à 1001 : cette
	// lecture est bornée à 1000 lots, et un rappel massif se serait donc annoncé douze fois trop petit.
	const impactedCount = $derived(form?.simulated ? form.impactedCount : 0);
</script>

<PageHead
	heading="Simulation de rappel"
	description="Estimez l'impact d'un rappel (lots et expéditions touchés) sans rien bloquer en base."
/>

{#if data.error}
	<p class="warn">API indisponible — {data.error}</p>
{/if}

<div class="layout">
	<section class="panel">
		<h3>Lot source</h3>
		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
				};
			}}
		>
			<!-- Le même composant filtrable que `/rappels-produits`, enveloppé dans le même `<label>` :
			     avec des dizaines de lots, une liste déroulante native oblige à faire défiler pour
			     retrouver un numéro qu'on a en main. Le `<label>` nomme le bouton du composant (premier
			     descendant étiquetable), comme le faisait le `<select>` natif remplacé ici. -->
			<label class="picker">
				<span>Sélectionnez le lot à l'origine du rappel</span>
				<SearchSelect
					name="lotId"
					options={lotOptions}
					bind:value={lotId}
					placeholder="— Choisir un lot —"
				/>
			</label>

			<button type="submit" class="btn" disabled={!lotId || submitting}>
				{submitting ? 'Simulation…' : 'Simuler le rappel'}
			</button>

			<p class="safe">
				<span class="safe-dot" aria-hidden="true"></span>
				Lecture seule — aucun lot n'est bloqué, aucune donnée n'est modifiée.
			</p>
		</form>
	</section>

	<section class="panel">
		<h3>Impact estimé</h3>

		{#if form && !form.simulated && form.message}
			<p class="error" role="alert">{form.message}</p>
		{:else if !form?.simulated}
			<p class="empty">Lancez une simulation pour estimer la propagation du rappel.</p>
		{:else}
			<div class="kpis">
				<div class="kpi">
					<span class="kpi-value">{impactedCount}</span>
					<span class="kpi-label">lots impactés (source incluse)</span>
				</div>
				<div class="kpi">
					<span class="kpi-value">{form.downstream.length}</span>
					<span class="kpi-label">lots descendants</span>
				</div>
			</div>

			<p class="src">Lot source : <strong>{sourceProduit}</strong></p>

			{#if form.depthSaturated}
				<p class="warn" role="alert">
					La descendance estimée peut être incomplète (profondeur de graphe saturée) — vérifiez
					manuellement les lots liés.
				</p>
			{/if}

			{#if form.downstream.length === 0}
				<p class="empty">Aucun lot descendant — le rappel se limiterait au lot source.</p>
			{:else}
				<ul class="hits">
					{#each form.downstream as lot (lot.id)}
						<li class="hit">
							<span class="hit-produit">{lot.produit}</span>
							<span class="hit-meta">{lot.lotNumber} · {lot.statut}</span>
						</li>
					{/each}
				</ul>
				{#if form.downstreamPartial}
					<p class="warn">
						Liste des lots tronquée à l'affichage — le compte ci-dessus reste exact.
					</p>
				{/if}
			{/if}

			<!-- La 4e étape du parcours qualité : quels magasins ont reçu la marchandise. Elle
			     n'était atteignable qu'en déclenchant un rappel réel, irréversible. -->
			<div class="shipments-block">
				<AffectedShipmentList
					shipments={form.affectedShipments}
					emptyLabel="Aucune expédition déjà partie ne contient ces lots."
				/>
				{#if form.affectedShipmentsTruncated}
					<p class="warn">
						{form.affectedShipmentsCount} expéditions concernées — seules les premières sont listées.
					</p>
				{/if}
			</div>
		{/if}
	</section>
</div>

<style>
	.warn {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fef9c3;
		color: #854d0e;
		font-size: 0.8125rem;
	}

	.layout {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
		gap: 1.25rem;
	}

	.panel {
		padding: 1.25rem 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.panel h3 {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* `SearchSelect` porte son propre habillage : ne reste ici que l'intitulé au-dessus du champ. */
	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.btn {
		align-self: flex-start;
		margin-top: 0.5rem;
		padding: 0.55rem 1.1rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn:hover:not(:disabled) {
		background: var(--nc-brand-hover);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.safe {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0.75rem 0 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.safe-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--nc-brand);
	}

	.kpis {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.kpi {
		flex: 1;
		padding: 0.875rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #f8fafc;
	}

	.kpi-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--nc-brand-dark);
	}

	.kpi-label {
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}

	.src {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}

	.src strong {
		color: var(--nc-text);
	}

	.empty {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}

	.error {
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fee2e2;
		color: #991b1b;
		font-size: 0.8125rem;
	}

	.hits {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.hit {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.625rem 0.875rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
	}

	.hit-produit {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nc-text);
	}

	.hit-meta {
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.shipments-block {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}
</style>

<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let lotId = $state('');
	let submitting = $state(false);

	const sourceProduit = $derived(
		data.lots.find((l) => l.id === (form?.simulated ? form.sourceLotId : lotId))?.produit ?? '—'
	);

	const impactedCount = $derived(form?.simulated ? form.downstream.length + 1 : 0);
</script>

<PageHead
	heading="Simulation de rappel"
	description="Estimez l'impact d'un rappel (lots et expéditions touchés) sans rien bloquer en base."
/>

{#if data.source === 'mock' && data.error}
	<p class="warn">API indisponible — liste de lots de démonstration ({data.error})</p>
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
			<label for="lot">Sélectionnez le lot à l'origine du rappel</label>
			<select id="lot" name="lotId" bind:value={lotId} required>
				<option value="" disabled>— Choisir un lot —</option>
				{#each data.lots as lot (lot.id)}
					<option value={lot.id}>{lot.produit} — {lot.id}</option>
				{/each}
			</select>

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
			{#if form.source === 'mock'}
				<p class="warn">
					Généalogie API indisponible — impact estimé à titre indicatif
					{#if form.error}({form.error}){/if}
				</p>
			{/if}

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

			<p class="src">Lot source : <strong>{sourceProduit}</strong> ({form.sourceLotId})</p>

			{#if form.downstream.length === 0}
				<p class="empty">Aucun lot descendant — le rappel se limiterait au lot source.</p>
			{:else}
				<ul class="hits">
					{#each form.downstream as lot (lot.id)}
						<li class="hit">
							<span class="hit-produit">{lot.produit}</span>
							<span class="hit-meta">{lot.id} · {lot.statut}</span>
						</li>
					{/each}
				</ul>
			{/if}
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

	label {
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	select {
		padding: 0.5rem 0.75rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--nc-text);
		background: #fff;
	}

	select:focus {
		outline: none;
		border-color: var(--nc-brand-border-focus);
		box-shadow: 0 0 0 3px var(--nc-brand-ring);
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
</style>

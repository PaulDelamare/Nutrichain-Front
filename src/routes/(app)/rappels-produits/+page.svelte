<script lang="ts">
	import { resolve } from '$app/paths';
	import RecallCard from '$lib/components/recall/RecallCard.svelte';
	import RecallResult from '$lib/components/recall/RecallResult.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Placeholder from '$lib/components/page/Placeholder.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';
	import { peutDeciderQualite } from '$lib/config/roles';
	import { libelleLotRappel } from '$lib/utils/lots/lotLabel';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const lotOptions = $derived(
		data.batches.map((b) => ({
			value: b.id,
			label: libelleLotRappel(b)
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
		<RecallResult recall={form.recall} />
	{/if}
</section>

{#if data.lotsSousRappel.length > 0}
	<section class="immobilises">
		<h2>Marchandise immobilisée ({data.lotsSousRappel.length})</h2>
		<p class="immobilises-hint">
			Ces lots sont au statut « alerte » : ils ne peuvent être ni transformés ni expédiés. Résoudre
			l'alerte d'un rappel ne les libère pas.
		</p>
		<ul>
			{#each data.lotsSousRappel as lot (lot.id)}
				<li>
					<a href={resolve('/(app)/fiche-lot/[lotId]', { lotId: lot.id })}
						>{libelleLotRappel(lot)}</a
					>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if rappels.length > 0}
	<div class="list">
		{#each rappels as recall (recall.id)}
			<RecallCard {recall} />
		{/each}
	</div>
{:else if !data.error && data.lotsSousRappel.length === 0}
	<Placeholder message="Aucun rappel produit en cours." />
{/if}

<style>
	.immobilises {
		margin-bottom: 1rem;
		padding: 0.9rem 1.1rem;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		background: #fef2f2;
	}

	.immobilises h2 {
		margin: 0 0 0.2rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.immobilises-hint {
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.immobilises ul {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.875rem;
	}

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

	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(24rem, 1fr));
		gap: 1rem;
		align-items: start;
	}
</style>

<script lang="ts">
	import BriefPanel from '$lib/components/store/BriefPanel.svelte';
	import StatCard from '$lib/components/store/StatCard.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Placeholder from '$lib/components/page/Placeholder.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHead
	heading="Portail magasins"
	description="Consignes de retrait, confirmations et traçabilité simplifiée pour la force de vente."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

{#if data.statsError}
	<p class="banner">Compteurs indisponibles — {data.statsError}</p>
{:else if data.statsRefuses}
	<p class="note">
		Les compteurs magasins s'appuient sur le fichier clients, réservé aux administrateurs. La
		consigne de retrait ci-dessous, elle, vous concerne.
	</p>
{/if}

<div class="stats">
	{#each data.storeStats as stat (stat.label)}
		<StatCard label={stat.label} value={stat.value} accent={stat.accent} />
	{/each}
</div>

{#if data.activeBrief}
	<BriefPanel title={data.activeBrief.title} text={data.activeBrief.text} />
{:else if !data.error}
	<Placeholder message="Aucune consigne active — aucun rappel produit en cours." />
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

	.note {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 12rem));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 520px) {
		.stats {
			grid-template-columns: 1fr;
		}
	}
</style>

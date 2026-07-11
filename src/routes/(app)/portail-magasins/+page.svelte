<script lang="ts">
	import BriefPanel from '$lib/components/store/BriefPanel.svelte';
	import StatCard from '$lib/components/store/StatCard.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHead
	heading="Portail magasins"
	description="Consignes de retrait, confirmations et traçabilité simplifiée pour la force de vente."
/>

{#if data.source === 'mock' && data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

<div class="stats">
	{#each data.storeStats as stat (stat.label)}
		<StatCard label={stat.label} value={stat.value} accent={stat.accent} />
	{/each}
</div>

<BriefPanel title={data.activeBrief.title} text={data.activeBrief.text} />

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
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

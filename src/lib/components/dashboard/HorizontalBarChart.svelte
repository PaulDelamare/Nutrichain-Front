<script lang="ts">
	import type { ChartSegment } from '$lib/types/dashboard-charts';

	type Props = {
		segments: ChartSegment[];
		emptyMessage?: string;
	};

	let { segments, emptyMessage = 'Aucune donnée.' }: Props = $props();

	const max = $derived(Math.max(...segments.map((s) => s.value), 1));
</script>

{#if segments.length === 0}
	<p class="chart-empty">{emptyMessage}</p>
{/if}

<ul class="h-bars" role="list">
	<!--
		Clé = l'index, pas le libellé. Deux segments peuvent légitimement porter le même nom : le
		tableau de bord affichait deux alertes « Critique », Svelte levait `each_key_duplicate`, et
		l'exception remontait jusqu'au layout — la barre latérale disparaissait, l'utilisateur
		arrivait sur la page d'accueil sans aucun menu (#89). Ces segments ne sont ni réordonnés ni
		filtrés après rendu : l'index est une clé stable ici.
	-->
	{#each segments as segment, i (i)}
		<li>
			<div class="row-head">
				<span class="label">{segment.label}</span>
				<span class="value">{segment.value}</span>
			</div>
			<div class="track">
				<div
					class="fill"
					style="width: {(segment.value / max) * 100}%; background: {segment.color}"
				></div>
			</div>
		</li>
	{/each}
</ul>

<style>
	.chart-empty {
		margin: 0;
		padding: 2rem 0;
		text-align: center;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}

	.h-bars {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.row-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.35rem;
		font-size: 0.8125rem;
	}

	.label {
		color: var(--nc-text-muted);
		font-weight: 500;
	}

	.value {
		font-weight: 600;
		color: var(--nc-text);
		font-variant-numeric: tabular-nums;
	}

	.track {
		height: 0.5rem;
		border-radius: 999px;
		background: #f1f5f9;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		border-radius: 999px;
		min-width: 0.25rem;
		transition: width 0.4s ease;
	}
</style>

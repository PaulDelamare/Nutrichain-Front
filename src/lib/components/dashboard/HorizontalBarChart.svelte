<script lang="ts">
	import type { ChartSegment } from '$lib/types/dashboard-charts';

	type Props = {
		segments: ChartSegment[];
	};

	let { segments }: Props = $props();

	const max = $derived(Math.max(...segments.map((s) => s.value), 1));
</script>

<ul class="h-bars" role="list">
	{#each segments as segment (segment.label)}
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

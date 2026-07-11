<script lang="ts">
	import type { ChartSegment } from '$lib/types/dashboard-charts';

	type Props = {
		segments: ChartSegment[];
		centerLabel?: string;
		size?: number;
		stroke?: number;
	};

	let { segments, centerLabel, size = 168, stroke = 22 }: Props = $props();

	const total = $derived(segments.reduce((sum, s) => sum + s.value, 0));
	const radius = $derived((size - stroke) / 2);
	const circumference = $derived(2 * Math.PI * radius);

	type Arc = ChartSegment & { offset: number; dash: number };

	const arcs = $derived.by(() => {
		if (total === 0) return [] as Arc[];
		let offset = 0;
		return segments.map((segment) => {
			const dash = (segment.value / total) * circumference;
			const arc: Arc = { ...segment, offset, dash };
			offset += dash;
			return arc;
		});
	});
</script>

<div class="donut-wrap">
	<div class="donut-ring" style="width: {size}px; height: {size}px;">
		<svg width={size} height={size} viewBox="0 0 {size} {size}" role="img" aria-hidden="true">
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="#f1f5f9"
				stroke-width={stroke}
			/>
			{#each arcs as arc (arc.label)}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={arc.color}
					stroke-width={stroke}
					stroke-dasharray="{arc.dash} {circumference - arc.dash}"
					stroke-dashoffset={-arc.offset}
					stroke-linecap="round"
					transform="rotate(-90 {size / 2} {size / 2})"
				/>
			{/each}
		</svg>
		<div class="center">
			<span class="center-value">{total}</span>
			{#if centerLabel}
				<span class="center-label">{centerLabel}</span>
			{/if}
		</div>
	</div>

	<ul class="legend">
		{#each segments as segment (segment.label)}
			<li>
				<span class="swatch" style="background: {segment.color}"></span>
				<span class="legend-label">{segment.label}</span>
				<span class="legend-value">{segment.value}</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.donut-wrap {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		width: 100%;
	}

	.donut-ring {
		position: relative;
		flex-shrink: 0;
	}

	.center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.center-value {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1;
		color: var(--nc-text);
	}

	.center-label {
		margin-top: 0.2rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--nc-text-subtle);
	}

	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		min-width: 9rem;
		flex: 1;
	}

	.legend li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0;
		font-size: 0.8125rem;
	}

	.swatch {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 999px;
		flex-shrink: 0;
	}

	.legend-label {
		color: var(--nc-text-muted);
	}

	.legend-value {
		font-weight: 600;
		color: var(--nc-text);
		font-variant-numeric: tabular-nums;
	}
</style>

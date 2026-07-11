<script lang="ts">
	import type { ChartSeries } from '$lib/types/dashboard-charts';

	type Props = {
		labels: string[];
		series: ChartSeries[];
		height?: number;
	};

	let { labels, series, height = 200 }: Props = $props();

	const pad = { top: 8, right: 8, bottom: 28, left: 8 };
	const chartW = 320;

	const layout = $derived.by(() => {
		const chartH = height;
		const innerW = chartW - pad.left - pad.right;
		const innerH = chartH - pad.top - pad.bottom;
		const barGap = 10;
		const barW = (innerW - barGap * (labels.length - 1)) / Math.max(labels.length, 1);
		return { chartH, innerW, innerH, barGap, barW };
	});

	const totals = $derived(
		labels.map((_, i) => series.reduce((sum, s) => sum + (s.data[i] ?? 0), 0))
	);
	const maxTotal = $derived(Math.max(...totals, 1));

	type BarPart = { y: number; h: number; color: string };

	const bars = $derived(
		labels.map((label, i) => {
			const { innerH, barGap, barW } = layout;
			const x = pad.left + i * (barW + barGap);
			const total = totals[i];
			const yBase = pad.top + innerH;

			if (total <= 0) {
				return { label, x, total, parts: [] as BarPart[] };
			}

			const barHeight = (total / maxTotal) * innerH;
			let cursor = yBase;
			const parts: BarPart[] = [];

			for (const s of series) {
				const val = s.data[i] ?? 0;
				if (val <= 0) continue;
				const h = (val / total) * barHeight;
				cursor -= h;
				parts.push({ y: cursor, h, color: s.color });
			}

			return { label, x, total, parts };
		})
	);
</script>

<div class="stacked-bar">
	<svg
		width="100%"
		height={layout.chartH}
		viewBox="0 0 {chartW} {layout.chartH}"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="Graphique en barres empilées"
	>
		{#each bars as bar (bar.label)}
			{#if bar.total > 0}
				{#each bar.parts as part, j (j)}
					<rect
						x={bar.x}
						y={part.y}
						width={layout.barW}
						height={part.h}
						fill={part.color}
						rx={j === bar.parts.length - 1 ? 4 : 0}
					/>
				{/each}
			{:else}
				<rect
					x={bar.x}
					y={pad.top + layout.innerH - 2}
					width={layout.barW}
					height={2}
					fill="#e2e8f0"
					rx={1}
				/>
			{/if}

			<text
				x={bar.x + layout.barW / 2}
				y={layout.chartH - 6}
				text-anchor="middle"
				class="axis-label"
			>
				{bar.label}
			</text>
		{/each}
	</svg>

	<ul class="legend">
		{#each series as s (s.name)}
			<li>
				<span class="swatch" style="background: {s.color}"></span>
				{s.name}
			</li>
		{/each}
	</ul>
</div>

<style>
	.stacked-bar {
		width: 100%;
	}

	.axis-label {
		font-size: 10px;
		fill: var(--nc-text-subtle);
		font-family: inherit;
		text-transform: capitalize;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
		justify-content: center;
	}

	.legend li {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}

	.swatch {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 2px;
		flex-shrink: 0;
	}
</style>

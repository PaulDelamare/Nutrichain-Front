<script lang="ts">
	import type { TelemetryPoint } from '$lib/Api/iot.server';

	type Props = {
		points: TelemetryPoint[];
		threshold?: number | null;
		label?: string;
	};

	let { points, threshold = null, label = 'Courbe de température' }: Props = $props();

	const sorted = $derived(
		[...points]
			.filter((p) => p.temperature != null)
			.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
	);

	const view = $derived.by(() => {
		if (sorted.length === 0) return null;

		const temps = sorted.map((p) => Number(p.temperature));
		const min = Math.min(...temps, threshold ?? temps[0]);
		const max = Math.max(...temps, threshold ?? temps[0]);
		const pad = Math.max((max - min) * 0.1, 0.5);
		const yMin = min - pad;
		const yMax = max + pad;
		const w = 320;
		const h = 120;

		const coords = sorted.map((p, i) => {
			const x = sorted.length === 1 ? w / 2 : (i / (sorted.length - 1)) * w;
			const y = h - ((Number(p.temperature) - yMin) / (yMax - yMin)) * h;
			return `${x},${y}`;
		});

		const thresholdY =
			threshold != null ? h - ((threshold - yMin) / (yMax - yMin)) * h : null;

		return { coords: coords.join(' '), w, h, thresholdY, yMin, yMax };
	});
</script>

{#if sorted.length === 0}
	<p class="empty">Aucune donnée de télémétrie disponible pour ce capteur.</p>
{:else if view}
	<figure class="chart">
		<figcaption>{label}</figcaption>
		<svg viewBox="0 0 {view.w} {view.h}" role="img" aria-label={label}>
			{#if view.thresholdY != null}
				<line
					x1="0"
					y1={view.thresholdY}
					x2={view.w}
					y2={view.thresholdY}
					class="threshold"
				/>
			{/if}
			<polyline points={view.coords} class="line" />
		</svg>
		<p class="range">
			{sorted.length} mesure{sorted.length > 1 ? 's' : ''} — min {Math.min(
				...sorted.map((p) => Number(p.temperature))
			).toFixed(1)} °C, max {Math.max(...sorted.map((p) => Number(p.temperature))).toFixed(1)} °C
		</p>
	</figure>
{/if}

<style>
	.chart {
		margin: 0;
		padding: 0.75rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	figcaption {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	svg {
		width: 100%;
		max-width: 28rem;
		height: auto;
	}

	.line {
		fill: none;
		stroke: var(--nc-brand);
		stroke-width: 2;
	}

	.threshold {
		stroke: #f59e0b;
		stroke-dasharray: 4 3;
		stroke-width: 1;
	}

	.range,
	.empty {
		margin: 0.35rem 0 0;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}
</style>

<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { KpiAccent } from '$lib/types/dashboard';

	type Props = {
		label: string;
		value: string;
		detail: string;
		href: Pathname;
		accent: KpiAccent;
	};

	let { label, value, detail, href, accent }: Props = $props();
</script>

<a class="kpi" href={resolve(href as '/')} data-accent={accent}>
	<p class="kpi-label">{label}</p>
	<p class="kpi-value">{value}</p>
	<p class="kpi-detail">{detail}</p>
</a>

<style>
	.kpi {
		display: block;
		padding: 1rem 1.125rem;
		/* Contour de la couleur liée à l'indicateur (data-accent) ; l'ensemble mène à sa page. */
		border: 1px solid var(--accent);
		border-radius: 0.5rem;
		background: #fff;
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
	}

	.kpi[data-accent='green'] {
		--accent: #16a34a;
		--accent-glow: rgba(22, 163, 74, 0.25);
	}
	.kpi[data-accent='red'] {
		--accent: #dc2626;
		--accent-glow: rgba(220, 38, 38, 0.25);
	}
	.kpi[data-accent='blue'] {
		--accent: #2563eb;
		--accent-glow: rgba(37, 99, 235, 0.25);
	}
	.kpi[data-accent='orange'] {
		--accent: #ea580c;
		--accent-glow: rgba(234, 88, 12, 0.25);
	}

	.kpi:hover,
	.kpi:focus-visible {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px var(--accent-glow);
		outline: none;
	}

	.kpi-label {
		margin: 0 0 0.5rem;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--nc-text-muted);
	}

	.kpi-value {
		margin: 0 0 0.25rem;
		font-size: 1.75rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--nc-text);
	}

	.kpi-detail {
		margin: 0;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}
</style>

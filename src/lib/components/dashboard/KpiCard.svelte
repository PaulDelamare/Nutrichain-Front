<script lang="ts">
	type Props = {
		label: string;
		value: string;
		detail: string;
	};

	let { label, value, detail }: Props = $props();
</script>

<article class="kpi">
	<p class="kpi-label">{label}</p>
	<p class="kpi-value">{value}</p>
	<p class="kpi-detail">{detail}</p>
</article>

<style>
	.kpi {
		padding: 1rem 1.125rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
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

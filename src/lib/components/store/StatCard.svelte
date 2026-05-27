<script lang="ts">
	type Props = {
		label: string;
		value: string;
		accent?: 'warn';
	};

	let { label, value, accent }: Props = $props();
</script>

<article class="stat" class:warn={accent === 'warn'}>
	<p class="label">{label}</p>
	<p class="value">{value}</p>
</article>

<style>
	.stat {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.stat.warn {
		border-left: 3px solid #f59e0b;
	}

	.label {
		margin: 0 0 0.5rem;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #64748b;
	}

	.value {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 600;
		line-height: 1.2;
		color: #0f172a;
	}
</style>

<script lang="ts">
	type Props = {
		title: string;
		subtitle?: string;
		children?: import('svelte').Snippet;
	};

	let { title, subtitle, children }: Props = $props();
</script>

<section class="chart-card">
	<header>
		<h3>{title}</h3>
		{#if subtitle}
			<p>{subtitle}</p>
		{/if}
	</header>
	<div class="chart-body">
		{@render children?.()}
	</div>
</section>

<style>
	.chart-card {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
		display: flex;
		flex-direction: column;
		min-height: 16rem;
	}

	header {
		margin-bottom: 0.75rem;
	}

	h3 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	header p {
		margin: 0.25rem 0 0;
		font-size: 0.75rem;
		color: var(--nc-text-subtle);
	}

	.chart-body {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
	}
</style>

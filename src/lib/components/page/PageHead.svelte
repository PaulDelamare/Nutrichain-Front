<script lang="ts">
	type Props = {
		heading: string;
		description?: string;
	};

	let { heading, description }: Props = $props();
</script>

<header class="page-head">
	<h2>{heading}</h2>
	{#if description}
		<p>{description}</p>
	{/if}
</header>

<style>
	.page-head {
		margin-bottom: 1.25rem;
	}

	.page-head h2 {
		margin: 0;
		font-size: 1.375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.page-head p {
		margin: 0.35rem 0 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}
</style>

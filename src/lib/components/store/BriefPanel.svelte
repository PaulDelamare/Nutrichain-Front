<script lang="ts">
	type Props = {
		title: string;
		text: string;
	};

	let { title, text }: Props = $props();
</script>

<section class="brief">
	<h3>{title}</h3>
	<p>{text}</p>
</section>

<style>
	.brief {
		padding: 1.25rem 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.brief h3 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.brief p {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.55;
		color: var(--nc-text-muted);
	}
</style>

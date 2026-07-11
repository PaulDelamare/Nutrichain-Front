<script lang="ts">
	type Props = {
		when: string;
		title: string;
		meta: string;
	};

	let { when, title, meta }: Props = $props();
</script>

<li class="event">
	<span class="dot" aria-hidden="true"></span>
	<div class="body">
		<p class="when">{when}</p>
		<p class="title">{title}</p>
		<p class="meta">{meta}</p>
	</div>
</li>

<style>
	.event {
		display: flex;
		gap: 0.75rem;
		padding: 0.875rem 0;
		border-bottom: 1px solid #f1f5f9;
		list-style: none;
	}

	.event:last-child {
		border-bottom: none;
	}

	.dot {
		width: 0.5rem;
		height: 0.5rem;
		margin-top: 0.35rem;
		border-radius: 50%;
		background: var(--nc-brand);
		flex-shrink: 0;
	}

	.when {
		margin: 0 0 0.15rem;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}

	.title {
		margin: 0 0 0.15rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.meta {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}
</style>

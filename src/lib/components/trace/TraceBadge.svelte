<script lang="ts">
	import type { TraceBadge } from '$lib/types/trace';

	type Props = {
		badge: TraceBadge;
	};

	let { badge }: Props = $props();
</script>

<span class="pill" class:green={badge.variant === 'green'} class:blue={badge.variant === 'blue'}>
	{badge.label}
</span>

<style>
	.pill {
		display: inline-block;
		margin-top: 0.35rem;
		padding: 0.2rem 0.55rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.green {
		background: #dcfce7;
		color: var(--nc-brand-dark);
	}

	.blue {
		background: #e0f2fe;
		color: #0369a1;
	}
</style>

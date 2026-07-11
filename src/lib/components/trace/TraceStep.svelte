<script lang="ts">
	import TraceBadge from './TraceBadge.svelte';
	import type { TraceStep } from '$lib/types/trace';

	type Props = TraceStep;

	let { phase, title, detail, badge, icon }: Props = $props();
</script>

<article class="step">
	<div
		class="icon"
		class:amont={icon === 'amont'}
		class:transform={icon === 'transform'}
		class:aval={icon === 'aval'}
	>
		{#if icon === 'amont'}
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M12 3c-3 4-6 6-6 10a6 6 0 1012 0c0-4-3-6-6-10z"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linejoin="round"
				/>
			</svg>
		{:else if icon === 'transform'}
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" />
				<path
					d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
			</svg>
		{:else}
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M4 8h16v12H4V8zm2-4h12v4H6V4z"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linejoin="round"
				/>
			</svg>
		{/if}
	</div>

	<div class="body">
		<p class="phase">{phase}</p>
		<h3 class="title">{title}</h3>
		{#if detail}
			<p class="detail">{detail}</p>
		{/if}
		{#if badge}
			<TraceBadge {badge} />
		{/if}
	</div>
</article>

<style>
	.step {
		display: flex;
		gap: 1rem;
		width: 100%;
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.icon {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.icon svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.amont {
		background: #dcfce7;
		color: var(--nc-brand-dark);
	}

	.transform {
		background: #f1f5f9;
		color: var(--nc-text-muted);
	}

	.aval {
		background: #ffedd5;
		color: #9a3412;
	}

	.body {
		min-width: 0;
	}

	.phase {
		margin: 0 0 0.25rem;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--nc-text-muted);
	}

	.title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.detail {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}
</style>

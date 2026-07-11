<script lang="ts">
	import type { LotEvent } from '$lib/types/lot-sheet';

	type Props = {
		events: LotEvent[];
		temperature?: string;
	};

	let { events, temperature = '—' }: Props = $props();
</script>

<section class="card">
	<h3>Historique & température</h3>
	<p class="temp">Température équipement : <strong>{temperature}</strong></p>
	{#if events.length === 0}
		<p class="empty">Aucun mouvement enregistré pour ce lot.</p>
	{:else}
		<ul>
			{#each events as event (event)}
				<li>
					<span class="dot" aria-hidden="true"></span>
					<div>
						<p class="when">
							{event.time}
							{#if event.day}
								— {event.day}
							{/if}
						</p>
						<p class="title">{event.title}</p>
						<p class="detail">{event.detail}</p>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.card {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.card h3 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.temp {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.empty {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	li:last-child {
		border-bottom: none;
		padding-bottom: 0;
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

	.detail {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}
</style>

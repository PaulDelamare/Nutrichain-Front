<script lang="ts">
	import type { LotEvent } from '$lib/types/lot-sheet';

	type Props = {
		events: LotEvent[];
		temperature?: string;
	};

	let { events, temperature = '—' }: Props = $props();

	const COLLAPSED_COUNT = 5;

	let expanded = $state(false);

	const visible = $derived(expanded ? events : events.slice(0, COLLAPSED_COUNT));
	const hiddenCount = $derived(Math.max(events.length - COLLAPSED_COUNT, 0));
</script>

<section class="card">
	<div class="head">
		<h3>Historique du lot</h3>
		<p class="temp">Température équipement : <strong>{temperature}</strong></p>
	</div>

	{#if events.length === 0}
		<p class="empty">
			Aucune étape enregistrée pour ce lot. Les lots créés avant la mise en place de la traçabilité
			des étapes n’ont pas d’historique rétroactif.
		</p>
	{:else}
		<ol class="timeline">
			{#each visible as event, i (event.title + event.time + i)}
				<li class="step {event.tone}">
					<span class="dot" aria-hidden="true"></span>
					<div class="body">
						<p class="when">{event.day} — {event.time}</p>
						<p class="title">{event.title}</p>
						{#if event.detail}
							<p class="detail">{event.detail}</p>
						{/if}
					</div>
				</li>
			{/each}
		</ol>

		{#if hiddenCount > 0}
			<button type="button" class="more" onclick={() => (expanded = !expanded)}>
				{expanded
					? 'Réduire l’historique'
					: `Voir les ${hiddenCount} étape${hiddenCount > 1 ? 's' : ''} précédente${hiddenCount > 1 ? 's' : ''}`}
			</button>
		{/if}

		<ul class="legend">
			<li><span class="key ok" aria-hidden="true"></span>Étape normale</li>
			<li><span class="key warn" aria-hidden="true"></span>Quarantaine — bloquant, levable</li>
			<li><span class="key danger" aria-hidden="true"></span>Rappel — irréversible</li>
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

	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.head h3 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.temp {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.empty {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}

	.timeline {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.step {
		position: relative;
		display: flex;
		gap: 0.875rem;
		padding: 0 0 1.1rem;
	}

	.step:not(:last-child)::before {
		content: '';
		position: absolute;
		left: 0.3125rem;
		top: 0.9rem;
		bottom: 0;
		width: 1px;
		background: #e2e8f0;
	}

	.step:last-child {
		padding-bottom: 0;
	}

	.dot {
		width: 0.6875rem;
		height: 0.6875rem;
		margin-top: 0.25rem;
		border-radius: 50%;
		flex-shrink: 0;
		z-index: 1;
		box-shadow: 0 0 0 2px #fff;
	}

	.ok .dot {
		background: var(--nc-brand-dark, #1b6b5c);
	}

	.neutral .dot {
		background: #94a3b8;
	}

	.warn .dot {
		background: #f59e0b;
	}

	.danger .dot {
		background: #ef4444;
	}

	.body {
		min-width: 0;
	}

	.when {
		margin: 0 0 0.1rem;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}

	.title {
		margin: 0 0 0.1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.warn .title {
		color: #92400e;
	}

	.danger .title {
		color: #991b1b;
	}

	.detail {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}

	.more {
		margin-top: 0.5rem;
		padding: 0;
		border: none;
		background: none;
		color: var(--nc-brand-dark, #1b6b5c);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}

	.more:hover {
		text-decoration: underline;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.875rem;
		margin: 1rem 0 0;
		padding: 0.75rem 0 0;
		border-top: 1px solid #f1f5f9;
		list-style: none;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}

	.legend li {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.key {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
	}

	.key.ok {
		background: var(--nc-brand-dark, #1b6b5c);
	}

	.key.warn {
		background: #f59e0b;
	}

	.key.danger {
		background: #ef4444;
	}
</style>

<script lang="ts">
	import { resolve } from '$app/paths';
	import type { QuarantineLot } from '$lib/types/nc';

	type Props = {
		lots: QuarantineLot[];
		onexport?: () => void;
	};

	let { lots, onexport }: Props = $props();
</script>

<section class="panel">
	<h3>Lots en quarantaine</h3>

	{#if lots.length === 0}
		<p class="empty">Aucun lot en quarantaine.</p>
	{:else}
		<ul>
			{#each lots as item (item.lot)}
				<li>
					<p class="lot">
						<a href={resolve('/(app)/fiche-lot/[lotId]', { lotId: encodeURIComponent(item.lot) })}>
							{item.lot}
						</a>
						— {item.detail}
					</p>
					<!-- Levée = décision qualité : motif obligatoire (tracé dans l'audit WORM). -->
					<form method="POST" action="?/release" class="release">
						<input type="hidden" name="lotId" value={item.lot} />
						<input
							type="text"
							name="motif"
							placeholder="Motif de levée (ex. 2ᵉ contrôle conforme)"
							required
							minlength="3"
						/>
						<button type="submit">Lever la quarantaine</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}

	<button type="button" class="export" onclick={onexport}>Exporter la liste</button>
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.panel h3 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	ul {
		flex: 1;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--nc-text-muted);
		padding: 0.625rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	li:last-child {
		border-bottom: none;
	}

	.lot {
		margin: 0 0 0.4rem;
	}

	.empty {
		flex: 1;
		margin: 0;
		font-size: 0.875rem;
		color: var(--nc-text-subtle);
	}

	.release {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.release input {
		flex: 1 1 12rem;
		min-width: 0;
		padding: 0.4rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}

	.release button {
		padding: 0.4rem 0.75rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}

	.release button:hover {
		background: var(--nc-brand-hover);
	}

	a {
		color: var(--nc-brand);
		font-weight: 500;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	.export {
		align-self: flex-start;
		margin-top: 1.25rem;
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
		cursor: pointer;
	}

	.export:hover {
		background: #f8fafc;
	}
</style>

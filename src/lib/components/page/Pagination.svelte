<script lang="ts">
	type Props = {
		page: number;
		totalPages: number;
		total: number;
		/** Libellé de ce qui est compté, au pluriel : « lots », « réceptions »… */
		unit: string;
		/** Mode lien (pagination serveur via l'URL). Exclusif avec `onselect`. */
		hrefFor?: (page: number) => string;
		/** Mode bouton (pagination client, sans navigation). Exclusif avec `hrefFor`. */
		onselect?: (page: number) => void;
	};

	let { page, totalPages, total, unit, hrefFor, onselect }: Props = $props();

	const hasPrevious = $derived(page > 1);
	const hasNext = $derived(page < totalPages);
</script>

{#if totalPages > 1}
	<nav class="pagination" aria-label="Pagination">
		{#if onselect}
			<!-- Mode client : pas de navigation, on découpe une liste déjà chargée. -->
			<button
				type="button"
				class="step"
				aria-disabled={!hasPrevious}
				disabled={!hasPrevious}
				onclick={() => onselect(page - 1)}
			>
				Précédent
			</button>

			<span class="status" aria-live="polite">
				Page {page} sur {totalPages} · {total}
				{unit}
			</span>

			<button
				type="button"
				class="step"
				aria-disabled={!hasNext}
				disabled={!hasNext}
				onclick={() => onselect(page + 1)}
			>
				Suivant
			</button>
		{:else if hrefFor}
			<!-- `hrefFor` est fourni par la page appelante, à qui il revient de passer par resolve() :
			     un composant générique ne connaît pas la route qu'il pagine. -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				class="step"
				href={hrefFor(page - 1)}
				aria-disabled={!hasPrevious}
				tabindex={hasPrevious ? undefined : -1}
			>
				Précédent
			</a>

			<!-- Le total dit ce que la page ne montre PAS : sans lui, une liste tronquée est
			     indiscernable d'une liste complète. -->
			<span class="status" aria-live="polite">
				Page {page} sur {totalPages} · {total}
				{unit}
			</span>

			<a
				class="step"
				href={hrefFor(page + 1)}
				aria-disabled={!hasNext}
				tabindex={hasNext ? undefined : -1}
			>
				Suivant
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	</nav>
{:else if total > 0}
	<p class="status lonely">{total} {unit}</p>
{/if}

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.step {
		padding: 0.4rem 0.85rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		color: var(--nc-brand);
		font-family: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
	}

	.step:hover {
		background: #f8fafc;
	}

	.step[aria-disabled='true'] {
		color: var(--nc-text-subtle);
		pointer-events: none;
		opacity: 0.55;
	}

	.status {
		color: var(--nc-text-muted);
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}

	.lonely {
		margin: 1rem 0 0;
		text-align: center;
	}
</style>

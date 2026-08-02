<script lang="ts">
	import type { Snippet } from 'svelte';

	// Barre de filtres partagée par les trois listings de la page Non-conformités : le conteneur
	// (grille, styles des champs, bouton) est mutualisé ici ; chaque listing fournit ses champs, dans
	// l'ordre des colonnes de son tableau. La recherche est automatique (debounce sur les textes,
	// immédiate sur les selects), gérée par chaque champ ; « Appliquer » couvre la touche Entrée.
	type Props = { onapply?: () => void; children: Snippet };

	let { onapply, children }: Props = $props();
</script>

<form
	class="filters"
	onsubmit={(e) => {
		e.preventDefault();
		onapply?.();
	}}
>
	{@render children()}
	<button type="submit" class="apply">Appliquer</button>
</form>

<style>
	.filters {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: 0.75rem 1rem;
		align-items: end;
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	/* Les champs viennent du snippet de l'appelant : on les stylise via :global sous .filters. */
	.filters :global(.field) {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.filters :global(.field span) {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--nc-text-muted);
	}

	.filters :global(.field input),
	.filters :global(.field select) {
		box-sizing: border-box;
		width: 100%;
		height: 2.25rem;
		padding: 0 0.625rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.875rem;
		color: var(--nc-text);
	}

	.filters :global(.field input:focus),
	.filters :global(.field select:focus) {
		outline: 2px solid var(--nc-brand-ring);
		outline-offset: 0;
		border-color: var(--nc-brand-border-focus);
	}

	.apply {
		height: 2.25rem;
		align-self: end;
		padding: 0 1.25rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}

	.apply:hover {
		background: var(--nc-brand-hover);
	}
</style>

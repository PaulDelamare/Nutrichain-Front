<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	// Tableau de listing réutilisable : il porte le chrome commun (carte bordée, en-tête, lignes,
	// état vide) pour que tous les listings de l'app se ressemblent. L'appelant fournit les en-têtes,
	// les lignes et un snippet `row` qui rend les <td> d'une ligne (colonnes et cellules spécifiques
	// à l'entité restent chez lui).
	type Props = {
		columns: string[];
		rows: T[];
		/** Clé stable de ligne (pour le keyed each). */
		rowKey: (item: T) => string | number;
		/** Message affiché quand aucune ligne ne correspond. */
		empty: string;
		row: Snippet<[T]>;
	};

	let { columns, rows, rowKey, empty, row }: Props = $props();
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				{#each columns as col, i (i)}
					<th>{col}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if rows.length === 0}
				<tr><td colspan={columns.length} class="empty">{empty}</td></tr>
			{:else}
				{#each rows as item (rowKey(item))}
					<tr>{@render row(item)}</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		overflow-x: auto;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e2e8f0;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--nc-text-muted);
		background: #f8fafc;
		white-space: nowrap;
	}

	/* Les <td> viennent du snippet `row` de l'appelant : on les stylise via :global sous .table-wrap
	   (les cellules spécifiques — .mono, liens, boutons — restent stylées chez l'appelant). */
	.table-wrap :global(td) {
		padding: 0.875rem 1rem;
		border-bottom: 1px solid #f1f5f9;
		color: var(--nc-text-muted);
		vertical-align: middle;
	}

	.table-wrap :global(tr:last-child td) {
		border-bottom: none;
	}

	.table-wrap :global(td.empty) {
		padding: 2rem 1rem;
		text-align: center;
		color: var(--nc-text-subtle);
	}
</style>

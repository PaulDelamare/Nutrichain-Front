<script lang="ts">
	import StatusBadge from './StatusBadge.svelte';
	import type { LotRow } from '$lib/types/lot';

	type Props = {
		rows: LotRow[];
	};

	let { rows }: Props = $props();
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Lot</th>
				<th>Produit</th>
				<th>GTIN</th>
				<th>Site</th>
				<th>Statut</th>
				<th>Dernière temp.</th>
			</tr>
		</thead>
		<tbody>
			{#if rows.length === 0}
				<tr>
					<td colspan="6" class="empty">Aucun lot ne correspond aux filtres.</td>
				</tr>
			{:else}
				{#each rows as row}
					<tr>
						<td>
							<a href="/fiche-lot/{encodeURIComponent(row.id)}">{row.id}</a>
						</td>
						<td>{row.produit}</td>
						<td class="mono">{row.gtin}</td>
						<td>{row.site}</td>
						<td><StatusBadge statut={row.statut} /></td>
						<td>{row.temperature}</td>
					</tr>
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
		color: #64748b;
		background: #f8fafc;
		white-space: nowrap;
	}

	td {
		padding: 0.875rem 1rem;
		border-bottom: 1px solid #f1f5f9;
		color: #334155;
		vertical-align: middle;
	}

	tr:last-child td {
		border-bottom: none;
	}

	a {
		color: #0d9488;
		font-weight: 500;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	.mono {
		font-variant-numeric: tabular-nums;
	}

	.empty {
		padding: 2rem 1rem;
		text-align: center;
		color: #94a3b8;
	}
</style>

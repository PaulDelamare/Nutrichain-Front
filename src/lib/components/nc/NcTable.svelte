<script lang="ts">
	import NcStatusBadge from './NcStatusBadge.svelte';
	import type { NcRow } from '$lib/types/nc';

	type Props = {
		rows: NcRow[];
	};

	let { rows }: Props = $props();
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>ID</th>
				<th>Type</th>
				<th>Statut</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr>
					<td class="id">{row.id}</td>
					<td>{row.type}</td>
					<td><NcStatusBadge statut={row.statut} /></td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th {
		padding: 0.625rem 0.75rem;
		border-bottom: 1px solid #e2e8f0;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		background: #f8fafc;
	}

	td {
		padding: 0.75rem;
		border-bottom: 1px solid #f1f5f9;
		color: #334155;
		vertical-align: middle;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.id {
		font-weight: 500;
		color: #0f172a;
	}
</style>

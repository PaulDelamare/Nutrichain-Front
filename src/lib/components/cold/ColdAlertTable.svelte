<script lang="ts">
	import ColdStatusBadge from './ColdStatusBadge.svelte';
	import type { ColdAlertRow } from '$lib/types/cold';

	type Props = {
		rows: ColdAlertRow[];
	};

	let { rows }: Props = $props();
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>ID</th>
				<th>Site</th>
				<th>Zone</th>
				<th>Temp. max</th>
				<th>Depuis</th>
				<th>Statut</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr>
					<td class="id">{row.id}</td>
					<td>{row.site}</td>
					<td>{row.zone}</td>
					<td>{row.tempMax}</td>
					<td>{row.depuis}</td>
					<td><ColdStatusBadge statut={row.statut} /></td>
				</tr>
			{/each}
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

	.id {
		font-weight: 500;
		color: #0f172a;
	}
</style>

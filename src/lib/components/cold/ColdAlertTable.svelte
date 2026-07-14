<script lang="ts">
	import { resolve } from '$app/paths';
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
				<th>Temp. actuelle</th>
				<th>Lots impactés</th>
				<th>Depuis</th>
				<th>Statut</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.id)}
				<tr>
					<td class="id">{row.id}</td>
					<td>{row.site}</td>
					<td>{row.zone}</td>
					<td>{row.tempActuelle}</td>
					<td class="lots">
						{#if row.lotsImpactes.length === 0}
							<span class="none">—</span>
						{:else}
							{#each row.lotsImpactes as lot (lot.id)}
								<a
									href={resolve('/(app)/fiche-lot/[lotId]', {
										lotId: encodeURIComponent(lot.id)
									})}
								>
									{lot.produit}
								</a>
							{/each}
						{/if}
					</td>
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
		color: var(--nc-text-muted);
		background: #f8fafc;
		white-space: nowrap;
	}

	td {
		padding: 0.875rem 1rem;
		border-bottom: 1px solid #f1f5f9;
		color: var(--nc-text-muted);
		vertical-align: middle;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.id {
		font-weight: 500;
		color: var(--nc-text);
	}

	.lots {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.lots a {
		color: var(--nc-brand);
		text-decoration: none;
		font-weight: 500;
	}

	.lots a:hover {
		text-decoration: underline;
	}

	.none {
		color: var(--nc-text-subtle);
	}
</style>

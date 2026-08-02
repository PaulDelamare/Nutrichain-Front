<script lang="ts">
	import { resolve } from '$app/paths';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import type { LotRow } from '$lib/types/lot';

	type Props = {
		rows: LotRow[];
	};

	let { rows }: Props = $props();

	const COLUMNS = ['Lot', 'Produit', 'GTIN', 'Site', 'Statut', 'Dernière temp.'];
</script>

<DataTable
	columns={COLUMNS}
	{rows}
	rowKey={(r) => r.id}
	empty="Aucun lot ne correspond aux filtres."
>
	{#snippet row(r)}
		<td>
			<a href={resolve('/(app)/fiche-lot/[lotId]', { lotId: encodeURIComponent(r.id) })}>
				{r.lotNumber ?? r.id}
			</a>
		</td>
		<td>{r.produit}</td>
		<td class="mono">{r.gtin}</td>
		<td>{r.site}</td>
		<td><StatusBadge statut={r.statut} /></td>
		<td>{r.temperature}</td>
	{/snippet}
</DataTable>

<style>
	a {
		color: var(--nc-brand);
		font-weight: 500;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	.mono {
		font-variant-numeric: tabular-nums;
	}
</style>

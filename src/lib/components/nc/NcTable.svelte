<script lang="ts">
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import NcStatusBadge from './NcStatusBadge.svelte';
	import type { NcRow } from '$lib/types/nc';

	type Props = {
		rows: NcRow[];
	};

	let { rows }: Props = $props();

	const COLUMNS = ['ID', 'Type', 'Lot', 'Statut'];
</script>

<DataTable
	columns={COLUMNS}
	{rows}
	rowKey={(r) => r.id}
	empty="Aucune non-conformité ne correspond aux filtres."
>
	{#snippet row(r)}
		<td class="id">{r.id}</td>
		<td>{r.type}</td>
		<td>{r.lot}</td>
		<td><NcStatusBadge statut={r.statut} /></td>
	{/snippet}
</DataTable>

<style>
	.id {
		font-weight: 500;
		color: var(--nc-text);
	}
</style>

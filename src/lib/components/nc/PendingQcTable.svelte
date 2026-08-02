<script lang="ts">
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import type { PendingQcLot } from '$lib/types/quality';

	type Props = {
		rows: PendingQcLot[];
		/** Rôle habilité à décider qualité : sinon la colonne Actions n'est pas rendue. */
		canAct: boolean;
		onsaisir?: (lot: PendingQcLot) => void;
	};

	let { rows, canAct, onsaisir }: Props = $props();

	const columns = $derived(
		canAct
			? ['Lot', 'Produit', 'Quantité', 'Depuis', 'Actions']
			: ['Lot', 'Produit', 'Quantité', 'Depuis']
	);
</script>

<DataTable {columns} {rows} rowKey={(r) => r.id} empty="Aucun lot ne correspond aux filtres.">
	{#snippet row(lot)}
		<td class="lot">{lot.lot}</td>
		<td>{lot.produit}</td>
		<td>{lot.quantite}</td>
		<td>{lot.depuis}</td>
		{#if canAct}
			<td>
				<button type="button" class="action" onclick={() => onsaisir?.(lot)}>
					Saisir le contrôle
				</button>
			</td>
		{/if}
	{/snippet}
</DataTable>

<style>
	.lot {
		font-weight: 600;
		color: var(--nc-text);
	}

	.action {
		padding: 0.35rem 0.75rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.8125rem;
		color: var(--nc-text);
		cursor: pointer;
		white-space: nowrap;
	}

	.action:hover {
		background: #f8fafc;
	}
</style>

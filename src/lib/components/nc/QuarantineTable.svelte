<script lang="ts">
	import { resolve } from '$app/paths';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import type { QuarantineLot } from '$lib/types/nc';

	type Props = {
		rows: QuarantineLot[];
		/** Rôle habilité à lever la quarantaine : sinon la colonne Actions n'est pas rendue. */
		canAct: boolean;
		onlever?: (lot: QuarantineLot) => void;
	};

	let { rows, canAct, onlever }: Props = $props();

	const columns = $derived(canAct ? ['Numéro', 'Détail', 'Actions'] : ['Numéro', 'Détail']);
</script>

<DataTable {columns} {rows} rowKey={(r) => r.id} empty="Aucun lot ne correspond aux filtres.">
	{#snippet row(lot)}
		<td>
			<!-- L'identifiant technique voyage dans le lien ; ce qui s'affiche est le numéro
			     d'étiquette (#81). -->
			<a href={resolve('/(app)/fiche-lot/[lotId]', { lotId: encodeURIComponent(lot.id) })}>
				{lot.numero}
			</a>
		</td>
		<td>{lot.detail}</td>
		{#if canAct}
			<td>
				<button type="button" class="action" onclick={() => onlever?.(lot)}>
					Lever la quarantaine
				</button>
			</td>
		{/if}
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

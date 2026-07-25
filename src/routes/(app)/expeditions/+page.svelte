<script lang="ts">
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Placeholder from '$lib/components/page/Placeholder.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHead
	heading="Expéditions"
	description="Flux sortants — destination, statut de livraison, lots embarqués."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

{#if data.shipments.length > 0}
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Référence</th>
					<th>Client</th>
					<th>Statut</th>
					<th>Date envoi</th>
					<th>Lots</th>
				</tr>
			</thead>
			<tbody>
				{#each data.shipments as row (row.id)}
					<tr>
						<td class="mono">{row.ref}</td>
						<td>{row.client}</td>
						<td>{row.statut}</td>
						<td>{row.date}</td>
						<td>{row.lots}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else if !data.error}
	<Placeholder message="Aucune expédition enregistrée pour le moment." />
{/if}

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

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

	th,
	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f1f5f9;
		text-align: left;
	}

	th {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--nc-text-muted);
		background: #f8fafc;
	}

	.mono {
		font-variant-numeric: tabular-nums;
	}
</style>

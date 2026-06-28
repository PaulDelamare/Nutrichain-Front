<script lang="ts">
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher action, entité, identifiant…');
		return () => pageSearch.deactivate();
	});

	const rows = $derived(
		filterRowsByText(data.rows, pageSearch.query, (r) => [r.when, r.action, r.entity, r.entityId])
	);
</script>

<PageHead
	heading="Journal d'audit"
	description="Piste WORM — actions, entités, horodatage (chaînage de hash)."
/>

{#if data.source === 'mock' && data.error}
	<p class="banner">API indisponible — {data.error}</p>
{:else if rows.length === 0}
	<p class="empty">Aucune entrée ne correspond à la recherche.</p>
{:else}
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Horodatage</th>
					<th>Action</th>
					<th>Entité</th>
					<th>Identifiant</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					<tr>
						<td>{row.when}</td>
						<td><code>{row.action}</code></td>
						<td>{row.entity}</td>
						<td class="mono">{row.entityId}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.banner,
	.empty {
		margin: 0;
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.banner {
		background: #fffbeb;
		color: #92400e;
	}

	.empty {
		background: #f8fafc;
		color: var(--nc-text-muted);
		border: 1px solid #e2e8f0;
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

	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--nc-text-muted);
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f1f5f9;
		color: var(--nc-text-muted);
	}

	.mono {
		font-family: ui-monospace, monospace;
		font-size: 0.8125rem;
	}
</style>

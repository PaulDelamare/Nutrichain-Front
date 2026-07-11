<script lang="ts">
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const REASON_LABELS: Record<string, string> = {
		prev_hash_mismatch: 'chaînage rompu (prev_hash)',
		signature_mismatch: 'signature altérée',
		truncation: 'lignes supprimées (troncature)'
	};

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher action, motif, entité, identifiant…');
		return () => pageSearch.deactivate();
	});

	// Filtre par type d'action : liste des actions réellement présentes (code → libellé).
	let actionFilter = $state('all');
	const actionOptions = $derived([
		...new Map(data.rows.map((r) => [r.action, r.actionLabel])).entries()
	]);

	const rows = $derived(
		filterRowsByText(
			data.rows.filter((r) => actionFilter === 'all' || r.action === actionFilter),
			pageSearch.query,
			(r) => [r.when, r.actionLabel, r.detail, r.entity, r.entityId]
		)
	);
</script>

<PageHead
	heading="Journal d'audit"
	description="Piste WORM — actions, entités, horodatage (chaînage de hash)."
/>

<section class="verify">
	<form method="POST" action="?/verify">
		<button type="submit">Vérifier l'intégrité de la chaîne</button>
	</form>
	<p class="verify-hint">
		Recalcule le hachage de chaque entrée et vérifie le chaînage — détecte toute altération ou
		suppression a posteriori (journal inviolable de type WORM).
	</p>

	{#if form?.verifyError}
		<p class="verify-result broken" role="status">Vérification impossible — {form.verifyError}</p>
	{:else if form?.verify}
		{#if form.verify.valid}
			<p class="verify-result ok" role="status">
				✅ Chaîne intacte — {form.verify.rowsChecked} entrée(s) vérifiée(s), aucune altération détectée.
			</p>
		{:else if form.verify.brokenAtReason === 'truncation'}
			<p class="verify-result broken" role="status">
				❌ Chaîne compromise — lignes supprimées (troncature) : attendu {form.verify
					.expectedRowCount} entrées, {form.verify.actualRowCount} trouvées.
			</p>
		{:else}
			<p class="verify-result broken" role="status">
				❌ Chaîne compromise — anomalie à l'entrée #{form.verify.brokenAtId} ({REASON_LABELS[
					form.verify.brokenAtReason ?? ''
				] ?? 'anomalie détectée'}).
			</p>
		{/if}
	{/if}
</section>

{#if data.source !== 'mock' && actionOptions.length > 1}
	<div class="filter">
		<label for="action-filter">Filtrer par action</label>
		<select id="action-filter" bind:value={actionFilter}>
			<option value="all">Toutes les actions</option>
			{#each actionOptions as [code, label] (code)}
				<option value={code}>{label}</option>
			{/each}
		</select>
	</div>
{/if}

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
					<th>Détail</th>
					<th>Entité</th>
					<th>Identifiant</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.id)}
					<tr>
						<td>{row.when}</td>
						<td><span class="action" title={row.action}>{row.actionLabel}</span></td>
						<td class="detail">{row.detail || '—'}</td>
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

	.action {
		font-weight: 500;
		color: var(--nc-text);
	}

	.detail {
		color: var(--nc-text);
	}

	.filter {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.filter select {
		padding: 0.35rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		background: #fff;
	}

	.verify {
		margin: 0 0 1.25rem;
	}

	.verify button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.verify button:hover {
		background: var(--nc-brand-hover);
	}

	.verify-hint {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.verify-result {
		margin: 0.75rem 0 0;
		padding: 0.625rem 0.875rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.verify-result.ok {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.verify-result.broken {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}
</style>

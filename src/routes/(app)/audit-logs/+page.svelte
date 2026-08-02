<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import AuditFilters from '$lib/components/audit/AuditFilters.svelte';
	import { pageHref } from '$lib/utils/pageSearch/pageHref';
	import { auditSearchParams, auditPageSizeParams } from '$lib/utils/audit/auditSearchParams';
	import { emptyAuditFilters } from '$lib/types/audit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const REASON_LABELS: Record<string, string> = {
		prev_hash_mismatch: 'chaînage rompu (prev_hash)',
		signature_mismatch: 'signature altérée',
		truncation: 'lignes supprimées (troncature)'
	};

	const columns = ['Horodatage', 'Action', 'Détail', 'Entité', 'Identifiant'];

	// --- Filtres pilotés par l'URL (requête filtrée côté API) ---
	// eslint-disable-next-line svelte/prefer-writable-derived
	let filters = $state(emptyAuditFilters());
	$effect(() => {
		filters = { ...data.filters };
	});

	const filtresActifs = $derived(
		data.filters.action !== 'tous' ||
			data.filters.entity !== 'tous' ||
			!!data.filters.entityId ||
			!!data.filters.from ||
			!!data.filters.to
	);
	const emptyMsg = $derived(
		filtresActifs
			? 'Aucune entrée ne correspond aux filtres.'
			: "Aucune entrée dans le journal d'audit."
	);

	const hrefForPage = $derived((target: number) =>
		pageHref(resolve('/audit-logs'), $page.url.searchParams, target)
	);

	function navigate(params: URLSearchParams) {
		const qs = params.toString();
		if (qs === $page.url.searchParams.toString()) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/audit-logs')}${qs ? `?${qs}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function apply() {
		navigate(auditSearchParams($page.url.searchParams, filters));
	}

	function changePageSize(event: Event) {
		const size = Number((event.currentTarget as HTMLSelectElement).value);
		navigate(auditPageSizeParams($page.url.searchParams, size));
	}
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

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

<AuditFilters bind:filters onapply={apply} />

<div class="toolbar">
	<label class="page-size">
		<span>Afficher</span>
		<select value={String(data.pageSize)} onchange={changePageSize} aria-label="Entrées par page">
			{#each data.pageSizeOptions as size (size)}
				<option value={String(size)}>{size} par page</option>
			{/each}
		</select>
	</label>
</div>

<div class="results">
	<DataTable {columns} rows={data.rows} rowKey={(r) => r.id} empty={emptyMsg}>
		{#snippet row(r)}
			<td>{r.when}</td>
			<!-- L'enum reste lisible en info-bulle ; le libellé traduit s'affiche. -->
			<td><span class="action" title={r.action}>{r.actionLabel}</span></td>
			<td class="detail">{r.detail || '—'}</td>
			<td>{r.entityLabel}</td>
			<td class="mono">{r.entityId}</td>
		{/snippet}
	</DataTable>
</div>

<Pagination
	page={data.pagination.page}
	totalPages={data.pagination.totalPages}
	total={data.pagination.total}
	unit="entrées"
	hrefFor={hrefForPage}
/>

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.875rem;
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

	.toolbar {
		display: flex;
		justify-content: flex-end;
		margin: 1rem 0 0.75rem;
	}

	.page-size {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.page-size select {
		height: 2.25rem;
		padding: 0 0.6rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.875rem;
		color: var(--nc-text);
	}

	.page-size select:focus {
		outline: 2px solid var(--nc-brand-ring);
		outline-offset: 0;
		border-color: var(--nc-brand-border-focus);
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

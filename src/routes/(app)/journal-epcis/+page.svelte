<script lang="ts">
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const EVENT_TYPE_LABELS: Record<string, string> = {
		ObjectEvent: 'Objet (réception / expédition)',
		AggregationEvent: 'Agrégation (conteneur SSCC)',
		TransformationEvent: 'Transformation'
	};

	const RELATED_ENTITY_LABELS: Record<string, string> = {
		Receipt: 'Réception',
		Shipment: 'Expédition',
		Transformation: 'Transformation'
	};

	const BIZSTEP_LABELS: Record<string, string> = {
		'urn:epcglobal:cbv:bizstep:receiving': 'Réception',
		'urn:epcglobal:cbv:bizstep:shipping': 'Expédition',
		'urn:epcglobal:cbv:bizstep:transforming': 'Transformation'
	};

	function fmtWhen(iso: string): string {
		const d = new Date(iso);
		return (
			d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) +
			' — ' +
			d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
		);
	}

	function payloadSummary(payload: Record<string, unknown>): string {
		const bizStep = typeof payload.bizStep === 'string' ? payload.bizStep : undefined;
		const label = bizStep ? (BIZSTEP_LABELS[bizStep] ?? bizStep) : null;
		const epcCount =
			(Array.isArray(payload.quantityList) && payload.quantityList.length) ||
			(Array.isArray(payload.inputQuantityList) && payload.inputQuantityList.length) ||
			(Array.isArray(payload.childQuantityList) && payload.childQuantityList.length) ||
			0;
		const parts = [label, epcCount ? `${epcCount} EPC` : null].filter(Boolean);
		return parts.length > 0 ? parts.join(' — ') : 'Voir le détail';
	}

	function filterHref(eventType: string | null, relatedEntity: string | null): string {
		const params = new SvelteURLSearchParams();
		if (eventType) params.set('event_type', eventType);
		if (relatedEntity) params.set('related_entity', relatedEntity);
		return `${resolve('/journal-epcis')}?${params}`;
	}
</script>

<PageHead
	heading="Journal EPCIS"
	description="Événements GS1/EPCIS produits par l'organisation — réception, transformation, expédition."
/>

<p class="export-row">
	<a class="export" href={resolve('/(app)/export-epcis')}>Exporter CSV (connecteur)</a>
</p>

<div class="filters">
	<label for="event-type-filter">Type d'événement</label>
	<select
		id="event-type-filter"
		onchange={(e) =>
			(window.location.href = filterHref(e.currentTarget.value || null, data.relatedEntity))}
	>
		<option value="" selected={!data.eventType}>Tous les types</option>
		{#each Object.entries(EVENT_TYPE_LABELS) as [code, label] (code)}
			<option value={code} selected={data.eventType === code}>{label}</option>
		{/each}
	</select>

	<label for="related-entity-filter">Origine</label>
	<select
		id="related-entity-filter"
		onchange={(e) =>
			(window.location.href = filterHref(data.eventType, e.currentTarget.value || null))}
	>
		<option value="" selected={!data.relatedEntity}>Toutes les origines</option>
		{#each Object.entries(RELATED_ENTITY_LABELS) as [code, label] (code)}
			<option value={code} selected={data.relatedEntity === code}>{label}</option>
		{/each}
	</select>
</div>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{:else if data.events.length === 0}
	<p class="empty">Aucun événement EPCIS ne correspond à ces critères.</p>
{:else}
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Horodatage</th>
					<th>Type</th>
					<th>Origine</th>
					<th>Résumé</th>
					<th>Détail</th>
				</tr>
			</thead>
			<tbody>
				{#each data.events as event (event.id)}
					<tr>
						<td>{fmtWhen(event.event_time)}</td>
						<td>{EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}</td>
						<td>{RELATED_ENTITY_LABELS[event.related_entity] ?? event.related_entity}</td>
						<td>{payloadSummary(event.payload)}</td>
						<td>
							<details>
								<summary>JSON</summary>
								<pre class="payload">{JSON.stringify(event.payload, null, 2)}</pre>
							</details>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.pagination.totalPages > 1}
		<nav class="pagination" aria-label="Pagination du journal EPCIS">
			<form method="GET" action={resolve('/journal-epcis')}>
				<input type="hidden" name="page" value={data.pagination.page - 1} />
				{#if data.eventType}<input type="hidden" name="event_type" value={data.eventType} />{/if}
				{#if data.relatedEntity}<input
						type="hidden"
						name="related_entity"
						value={data.relatedEntity}
					/>{/if}
				<button type="submit" class="page-link" disabled={data.pagination.page <= 1}>
					Précédent
				</button>
			</form>
			<span class="page-status">
				Page {data.pagination.page} / {data.pagination.totalPages} — {data.pagination.total} événement(s)
			</span>
			<form method="GET" action={resolve('/journal-epcis')}>
				<input type="hidden" name="page" value={data.pagination.page + 1} />
				{#if data.eventType}<input type="hidden" name="event_type" value={data.eventType} />{/if}
				{#if data.relatedEntity}<input
						type="hidden"
						name="related_entity"
						value={data.relatedEntity}
					/>{/if}
				<button
					type="submit"
					class="page-link"
					disabled={data.pagination.page >= data.pagination.totalPages}
				>
					Suivant
				</button>
			</form>
		</nav>
	{/if}
{/if}

<style>
	.export-row {
		margin: 0 0 0.75rem;
	}

	.export {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--nc-brand);
		text-decoration: none;
	}

	.export:hover {
		text-decoration: underline;
	}

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

	.filters {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.filters select {
		padding: 0.35rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		background: #fff;
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
		vertical-align: top;
	}

	.payload {
		margin: 0.5rem 0 0;
		padding: 0.5rem;
		background: #0f172a;
		color: #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		max-width: 32rem;
		overflow-x: auto;
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin: 1rem 0 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.page-link {
		padding: 0.35rem 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		color: var(--nc-text);
		font: inherit;
		cursor: pointer;
	}

	.page-link:disabled {
		cursor: not-allowed;
		opacity: 0.4;
	}
</style>

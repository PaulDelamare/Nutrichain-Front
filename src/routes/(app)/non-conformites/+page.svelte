<script lang="ts">
	import NcPanel from '$lib/components/nc/NcPanel.svelte';
	import QuarantinePanel from '$lib/components/nc/QuarantinePanel.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher NC, type, lot en quarantaine…');
		return () => pageSearch.deactivate();
	});

	const openNc = $derived(
		filterRowsByText(data.openNc, pageSearch.query, (r) => [r.id, r.type, r.statut])
	);
	const quarantineLots = $derived(
		filterRowsByText(data.quarantineLots, pageSearch.query, (l) => [l.lot, l.detail])
	);

	function exportList() {
		// branchement export à prévoir
	}
</script>

<PageHead
	heading="Non-conformités & quarantaine"
	description="Suivi des écarts, causes, actions correctives et lots bloqués."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

{#if form?.released}
	<p class="feedback ok" role="status">
		✅ Quarantaine levée — le lot est remis en stock (décision tracée dans l'audit).
	</p>
{:else if form?.releaseError}
	<p class="feedback err" role="status">❌ Levée impossible — {form.releaseError}</p>
{/if}

{#if !data.error}
	<div class="grid">
		<NcPanel rows={openNc} />
		<QuarantinePanel lots={quarantineLots} onexport={exportList} />
	</div>
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

	.feedback {
		margin: 0 0 0.75rem;
		padding: 0.625rem 0.875rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.feedback.ok {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.feedback.err {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		align-items: stretch;
	}

	@media (max-width: 900px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>

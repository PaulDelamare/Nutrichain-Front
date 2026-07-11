<script lang="ts">
	import NcPanel from '$lib/components/nc/NcPanel.svelte';
	import QuarantinePanel from '$lib/components/nc/QuarantinePanel.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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

{#if data.source === 'mock' && data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

<div class="grid">
	<NcPanel rows={openNc} />
	<QuarantinePanel lots={quarantineLots} onexport={exportList} />
</div>

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
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

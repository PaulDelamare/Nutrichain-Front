<script lang="ts">
	import ColdAlertTable from '$lib/components/cold/ColdAlertTable.svelte';
	import IncidentBanner from '$lib/components/cold/IncidentBanner.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher site, zone, alerte…');
		return () => pageSearch.deactivate();
	});

	const alerts = $derived(
		filterRowsByText(data.alerts, pageSearch.query, (a) => [
			a.id,
			a.site,
			a.zone,
			a.tempMax,
			a.statut,
			a.depuis
		])
	);
</script>

<PageHead
	heading="Alertes chaîne du froid"
	description="Surveillance temps réel — seuils, capteurs, escalade qualité."
/>

{#if data.source === 'mock' && data.error}
	<p class="banner">API indisponible — affichage démo</p>
{/if}

<IncidentBanner incident={data.incident} />

<ColdAlertTable rows={alerts} />

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}
</style>

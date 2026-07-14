<script lang="ts">
	import { resolve } from '$app/paths';
	import IdentityCard from '$lib/components/lot-sheet/IdentityCard.svelte';
	import HistoryPanel from '$lib/components/lot-sheet/HistoryPanel.svelte';
	import LocationPanel from '$lib/components/lot-sheet/LocationPanel.svelte';
	import LotActionsPanel from '$lib/components/lot-sheet/LotActionsPanel.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher dans l’historique du lot…');
		return () => pageSearch.deactivate();
	});

	const events = $derived(
		filterRowsByText(data.sheet.events, pageSearch.query, (e) => [e.time, e.day, e.title, e.detail])
	);
</script>

<header class="page-top">
	<a href={resolve('/recherche-lots')} class="back-link">
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M15 6l-6 6 6 6"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		Retour
	</a>

	<PageHead
		heading="Fiche lot {data.sheet.id}"
		description="Produit, dates, statut, historique, température, évènements EPCIS, localisation et carte."
	/>
</header>

<p class="source">Données en direct depuis la base NutriChain.</p>

<div class="layout">
	<div class="main">
		<IdentityCard sheet={data.sheet} />
		<HistoryPanel {events} temperature={data.sheet.temperature} />
	</div>
	<div class="side">
		<LotActionsPanel
			lotId={data.sheet.id}
			statut={data.sheet.statut}
			{form}
			role={data.user.role}
		/>
		<LocationPanel sheet={data.sheet} />
	</div>
</div>

<style>
	.page-top {
		margin-bottom: 0.25rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nc-brand);
		text-decoration: none;
	}

	.back-link:hover {
		color: var(--nc-brand-hover);
	}

	.back-link svg {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.source {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.layout {
		display: grid;
		grid-template-columns: 1fr minmax(14rem, 18rem);
		gap: 1rem;
		align-items: start;
	}

	.main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>

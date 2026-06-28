<script lang="ts">
	import ChartCard from '$lib/components/dashboard/ChartCard.svelte';
	import DonutChart from '$lib/components/dashboard/DonutChart.svelte';
	import EventRow from '$lib/components/dashboard/EventRow.svelte';
	import HorizontalBarChart from '$lib/components/dashboard/HorizontalBarChart.svelte';
	import KpiCard from '$lib/components/dashboard/KpiCard.svelte';
	import StackedBarChart from '$lib/components/dashboard/StackedBarChart.svelte';
	import TaskAlert from '$lib/components/dashboard/TaskAlert.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { findNavItem } from '$lib/config/nav';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher dans l’activité et les tâches…');
		return () => pageSearch.deactivate();
	});

	const nav = $derived(findNavItem($page.url.pathname));

	const recentEvents = $derived(
		filterRowsByText(data.recentEvents, pageSearch.query, (e) => [e.when, e.title, e.meta])
	);
	const tasks = $derived(
		filterRowsByText(data.tasks, pageSearch.query, (t) => [t.text, t.link?.label, t.variant])
	);
</script>

<div class="dashboard">
	{#if nav}
		<div class="dashboard-head">
			<PageHead heading={nav.heading} description={nav.description} />
		</div>
	{/if}

	<div class="dashboard-body">
		{#if data.source === 'mock'}
			<p class="banner">Certaines métriques utilisent des valeurs de démonstration.</p>
		{/if}

		<div class="kpis">
		{#each data.kpis as kpi}
			<KpiCard label={kpi.label} value={kpi.value} detail={kpi.detail} />
		{/each}
	</div>

	<section class="charts">
		<ChartCard title="Répartition des lots" subtitle="Par statut opérationnel">
			<DonutChart segments={data.charts.lotStatus} centerLabel="lots" />
		</ChartCard>

		<ChartCard title="Flux logistiques" subtitle="7 derniers jours — événements EPCIS">
			<StackedBarChart
				labels={data.charts.weeklyMovements.labels}
				series={data.charts.weeklyMovements.series}
			/>
		</ChartCard>

		<ChartCard title="Alertes actives" subtitle="Par niveau de gravité">
			<HorizontalBarChart segments={data.charts.alertSeverity} />
		</ChartCard>

		<ChartCard title="Contrôles qualité" subtitle="État des lots suivis">
			<DonutChart segments={data.charts.qualityResults} centerLabel="contrôles" />
		</ChartCard>
	</section>

	<div class="panels">
		<section class="panel">
			<h3>Activité récente (EPCIS)</h3>
			<ul>
				{#each recentEvents as event}
					<EventRow when={event.when} title={event.title} meta={event.meta} />
				{/each}
			</ul>
		</section>

		<section class="panel">
			<h3>À traiter</h3>
			<div class="tasks">
				{#each tasks as task}
					<TaskAlert variant={task.variant} text={task.text} link={task.link} />
				{/each}
			</div>
		</section>
	</div>
	</div>
</div>

<style>
	@keyframes dashboard-fade-in {
		from {
			opacity: 0;
			transform: translateY(0.5rem);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dashboard {
		--enter-ease: cubic-bezier(0.22, 1, 0.36, 1);
		--enter-title-duration: 0.66s;
		--enter-body-duration: 0.38s;
		--enter-body-delay: 0.32s;
	}

	.dashboard-head,
	.dashboard-body {
		opacity: 0;
	}

	.dashboard-head {
		animation: dashboard-fade-in var(--enter-title-duration) var(--enter-ease) forwards;
		animation-delay: 0ms;
	}

	.dashboard-body {
		animation: dashboard-fade-in var(--enter-body-duration) var(--enter-ease) forwards;
		animation-delay: var(--enter-body-delay);
	}

	@media (prefers-reduced-motion: reduce) {
		.dashboard-head,
		.dashboard-body {
			opacity: 1;
			animation: none;
			transform: none;
		}
	}

	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

	.kpis {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.charts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.panels {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 1rem;
	}

	.panel {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.panel h3 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.panel ul {
		margin: 0;
		padding: 0;
	}

	.tasks {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	@media (max-width: 1200px) {
		.kpis {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.charts {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.kpis {
			grid-template-columns: 1fr;
		}

		.panels {
			grid-template-columns: 1fr;
		}
	}
</style>

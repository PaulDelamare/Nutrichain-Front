<script lang="ts">
	import ColdAlertTable from '$lib/components/cold/ColdAlertTable.svelte';
	import TemperatureChart from '$lib/components/cold/TemperatureChart.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Placeholder from '$lib/components/page/Placeholder.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Le bouton de simulation a le même périmètre que les décisions qualité (il bloque des lots).
	const canSimulate = $derived(['owner', 'admin', 'quality'].includes(data.user.role ?? ''));
</script>

<PageHead
	heading="Alertes chaîne du froid"
	description="Surveillance temps réel — seuils, capteurs, escalade qualité."
/>

{#if canSimulate}
	<form method="POST" action="?/simulate" class="sim">
		<button type="submit" class="sim-btn">Simuler un incident</button>
		<span class="sim-hint">Déclenche une vraie excursion pour la démonstration.</span>
	</form>
{/if}

{#if form && 'simulateError' in form && form.simulateError}
	<p class="banner" role="alert">{form.simulateError}</p>
{/if}
{#if form && 'simulated' in form && form.simulated}
	<p class="ok" role="status">
		Incident simulé — {form.quarantinedCount} lot(s) mis en quarantaine.
	</p>
{/if}

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

{#if data.telemetry}
	<section class="telemetry">
		<TemperatureChart
			points={data.telemetry.points}
			threshold={data.telemetry.threshold}
			label="Capteur {data.telemetry.sensorId}"
		/>
		{#if data.telemetryError}
			<p class="telemetry-error" role="status">
				Relevés indisponibles : {data.telemetryError}
			</p>
		{/if}
	</section>
{/if}

{#if data.alerts.length > 0}
	<ColdAlertTable rows={data.alerts} role={data.user.role} {form} />
{:else if !data.error}
	<Placeholder message="Aucune alerte de chaîne du froid active." />
{/if}

<style>
	.telemetry {
		margin-bottom: 1rem;
	}

	.telemetry-error {
		margin: 0.375rem 0 0;
		color: #92400e;
		font-size: 0.8125rem;
	}

	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

	.sim {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin: 0 0 1rem;
	}

	.sim-btn {
		border: 1px solid #b91c1c;
		background: #dc2626;
		color: #fff;
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0.45rem 0.9rem;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.sim-btn:hover {
		background: #b91c1c;
	}

	.sim-hint {
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}

	.ok {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #ecfdf5;
		color: #065f46;
		font-size: 0.8125rem;
	}
</style>

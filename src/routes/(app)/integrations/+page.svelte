<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '$lib/components/page/PageHead.svelte';
</script>

<PageHead
	heading="Intégrations ERP / WMS / TMS"
	description="Échanges de données disponibles — import CSV (Configuration) et export EPCIS."
/>

<section class="card">
	<h2>Export événements EPCIS</h2>
	<p>
		Télécharge le journal GS1/EPCIS de l’organisation au format CSV (connecteur
		<code>GET /api/connectors/exports/events</code>).
	</p>
	<a class="btn" href={resolve('/(app)/export-epcis')}>Télécharger epcis-events.csv</a>
</section>

<section class="muted card">
	<h2>Connecteurs temps réel</h2>
	<p>
		Aucun statut de connecteur ERP / WMS / TMS n’est exposé par l’API pour l’instant. Les imports
		catalogue (produits, clients) se configurent dans
		<a href={resolve('/(app)/configuration')}>Configuration</a>.
	</p>
</section>

<style>
	.card {
		margin: 0 0 1rem;
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.card.muted {
		background: #f8fafc;
	}

	.card h2 {
		margin: 0 0 0.5rem;
		font-size: 0.9375rem;
	}

	.card p {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
		line-height: 1.5;
	}

	.card code {
		font-size: 0.75rem;
	}

	.btn {
		display: inline-block;
		padding: 0.45rem 0.85rem;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.8125rem;
		font-weight: 500;
		text-decoration: none;
	}

	a:not(.btn) {
		color: var(--nc-brand);
		font-weight: 500;
	}
</style>

<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.scan?.lot.nom_produit ?? 'Scan produit'} — NutriChain</title>
</svelte:head>

<main class="page">
	<header class="brand">
		<h1>NutriChain</h1>
		<p>Traçabilité alimentaire pour le consommateur</p>
	</header>

	{#if data.error}
		<section class="card err">
			<h2>Produit introuvable</h2>
			<p>{data.error}</p>
		</section>
	{:else if data.scan}
		<section class="card">
			<h2>{data.scan.lot.nom_produit}</h2>
			<p class="producer">Produit par {data.scan.lot.producteur}</p>

			<dl class="facts">
				<div>
					<dt>GTIN</dt>
					<dd>{data.scan.lot.gtin}</dd>
				</div>
				<div>
					<dt>Date limite</dt>
					<dd>
						{data.scan.lot.date_peremption
							? new Date(data.scan.lot.date_peremption).toLocaleDateString('fr-FR')
							: '—'}
					</dd>
				</div>
				<div>
					<dt>Statut sanitaire</dt>
					<dd class:alert={data.scan.lot.statut_sanitaire === 'RAPPEL_CONSOMMATEUR'}>
						{data.scan.lot.statut_sanitaire === 'RAPPEL_CONSOMMATEUR'
							? '⚠️ Rappel en cours — ne pas consommer'
							: '✅ Conforme'}
					</dd>
				</div>
			</dl>

			<section class="trace">
				<h3>Origine du produit</h3>
				<p>{data.scan.trace.message}</p>
				{#if data.scan.trace.etapes_details.length > 0}
					<ul>
						{#each data.scan.trace.etapes_details as step (step.produit + step.date)}
							<li>
								<strong>{step.produit}</strong>
								<span>{new Date(step.date).toLocaleDateString('fr-FR')}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</section>
	{/if}
</main>

<style>
	.page {
		min-height: 100vh;
		padding: 2rem 1rem 3rem;
		background: linear-gradient(180deg, #f0fdf9 0%, #fff 40%);
	}

	.brand {
		max-width: 32rem;
		margin: 0 auto 1.5rem;
		text-align: center;
	}

	.brand h1 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--nc-brand-dark, #1b6b5c);
	}

	.brand p {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted, #64748b);
	}

	.card {
		max-width: 32rem;
		margin: 0 auto;
		padding: 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		background: #fff;
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
	}

	.card.err {
		border-color: #fecaca;
		background: #fef2f2;
	}

	.card h2 {
		margin: 0 0 0.25rem;
		font-size: 1.25rem;
	}

	.producer {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		color: var(--nc-text-muted, #64748b);
	}

	.facts {
		display: grid;
		gap: 0.75rem;
		margin: 0 0 1.25rem;
	}

	.facts div {
		display: grid;
		grid-template-columns: 8rem 1fr;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	dt {
		color: var(--nc-text-muted, #64748b);
	}

	dd {
		margin: 0;
		font-weight: 500;
	}

	dd.alert {
		color: #b91c1c;
	}

	.trace h3 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
	}

	.trace p {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		color: var(--nc-text-muted, #64748b);
	}

	.trace ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.trace li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0;
		border-top: 1px solid #f1f5f9;
		font-size: 0.875rem;
	}

	.trace span {
		color: var(--nc-text-muted, #64748b);
	}
</style>

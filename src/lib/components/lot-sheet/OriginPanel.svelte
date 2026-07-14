<script lang="ts">
	import type { ApiOrigin } from '$lib/Api/traceability.server';

	type Props = {
		origines: ApiOrigin[];
	};

	let { origines }: Props = $props();

	function jour(iso: string): string {
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
	}
</script>

<section class="card">
	<h3>Amont — matière première</h3>

	{#if origines.length === 0}
		<p class="empty">
			Aucune réception rattachée. Ce lot n'a pas d'origine fournisseur tracée (produit fini pur ou
			lot antérieur à la traçabilité amont).
		</p>
	{:else}
		<ul>
			{#each origines as o (o.lot_number)}
				<li>
					<span class="ferme">{o.fournisseur.nom_ferme}</span>
					<span class="meta">Lot {o.lot_number} · reçu le {jour(o.date_reception)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.card {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	h3 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	li {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding-left: 0.75rem;
		border-left: 2px solid var(--nc-brand);
	}

	.ferme {
		font-weight: 600;
		color: var(--nc-text);
	}

	.meta {
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.empty {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}
</style>

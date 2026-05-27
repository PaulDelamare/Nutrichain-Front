<script lang="ts">
	import StatusBadge from '$lib/components/lots/StatusBadge.svelte';
	import type { LotSheet } from '$lib/types/lot-sheet';

	type Props = {
		sheet: LotSheet;
	};

	let { sheet }: Props = $props();
</script>

<section class="card">
	<div class="head">
		<h3>Identité</h3>
		<StatusBadge statut={sheet.statut} />
	</div>

	<dl>
		<div>
			<dt>Produit</dt>
			<dd>{sheet.produit}</dd>
		</div>
		<div>
			<dt>GTIN</dt>
			<dd>{sheet.gtin}</dd>
		</div>
		<div>
			<dt>DLC</dt>
			<dd>{sheet.dlc}</dd>
		</div>
		<div>
			<dt>Quantité</dt>
			<dd>{sheet.quantite}</dd>
		</div>
		<div>
			<dt>Statut système</dt>
			<dd>{sheet.statutRaw}</dd>
		</div>
		<div>
			<dt>Température actuelle</dt>
			<dd>{sheet.temperature}</dd>
		</div>
		<div>
			<dt>Créé par</dt>
			<dd>{sheet.createdBy}</dd>
		</div>
	</dl>
</section>

<style>
	.card {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.head h3 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #0f172a;
	}

	dl {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem 1.5rem;
		margin: 0;
	}

	dt {
		margin: 0 0 0.15rem;
		font-size: 0.75rem;
		color: #64748b;
	}

	dd {
		margin: 0;
		font-size: 0.875rem;
		color: #0f172a;
	}

	@media (max-width: 520px) {
		dl {
			grid-template-columns: 1fr;
		}
	}
</style>

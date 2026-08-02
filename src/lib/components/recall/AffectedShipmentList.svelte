<script module lang="ts">
	/**
	 * Liste des magasins touchés, partagée par le rappel réel et sa simulation.
	 *
	 * Le type est réduit à ce que les DEUX écrans affichent : la simulation ne reçoit ni contact ni
	 * e-mail du client, et les exiger ici l'empêcherait de réutiliser ce composant. La phrase de tête
	 * reste à la charge de chaque écran — l'un exécute, l'autre estime, et confondre les deux est
	 * précisément le défaut qu'on corrige.
	 */
	export type AffectedShipmentSummary = {
		shipmentId: string;
		shipmentRef: string;
		customerName: string;
		statutLivraison: string;
		transporteur: string;
		batchIds: string[];
	};
</script>

<script lang="ts">
	type Props = {
		shipments: AffectedShipmentSummary[];
		emptyLabel?: string;
	};

	let { shipments, emptyLabel = 'Aucune expédition déjà partie ne contient ces lots.' }: Props =
		$props();
</script>

{#if shipments.length > 0}
	<p class="shipments-label">Magasins / expéditions touchés</p>
	<ul class="shipments">
		{#each shipments as shipment (shipment.shipmentId)}
			<li>
				<strong>{shipment.customerName}</strong>
				— {shipment.shipmentRef}
				({shipment.statutLivraison}) · {shipment.batchIds.length}
				lot{shipment.batchIds.length > 1 ? 's' : ''} · transporteur {shipment.transporteur}
			</li>
		{/each}
	</ul>
{:else}
	<p class="no-shipment">{emptyLabel}</p>
{/if}

<style>
	.shipments-label {
		margin: 0 0 0.35rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.shipments {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.shipments li {
		margin-bottom: 0.25rem;
	}

	.no-shipment {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}
</style>

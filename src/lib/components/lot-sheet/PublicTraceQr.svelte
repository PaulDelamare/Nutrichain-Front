<script lang="ts">
	import { base } from '$app/paths';
	import type { LotStatus } from '$lib/types/lot';

	type Props = {
		lotId: string;
		statut: LotStatus;
	};

	let { lotId, statut }: Props = $props();

	// Le PNG est deja servi par /fiche-lot/[lotId]/label : il encode le GS1 Digital Link (gtin + lot).
	// Scanne, il ouvre la fiche publique consommateur. On reconstruit juste le chemin, base comprise.
	const src = $derived(`${base}/fiche-lot/${encodeURIComponent(lotId)}/label`);

	// La fiche publique n'expose qu'un lot commercialise (EXPEDIE) ou sous rappel : hors expedition,
	// un scan renvoie 404. On le dit, pour ne pas faire passer une regle metier pour un bug.
	const liveForConsumer = $derived(statut === 'expedie');
</script>

<!-- Pose dans l'en-tete de la fiche, a l'oppose du titre : pas de carte, sur le fond de page. -->
<div class="qr-block">
	<img class="qr" {src} alt="QR code de traçabilité publique du lot" width="118" height="118" />
	<p class="cap">Fiche publique — scannez</p>
	{#if !liveForConsumer}
		<p class="note">La fiche publique s'affiche une fois le lot expédié.</p>
	{/if}
</div>

<style>
	.qr-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		flex-shrink: 0;
		width: 118px;
	}

	.qr {
		display: block;
		width: 118px;
		height: 118px;
		image-rendering: pixelated;
	}

	.cap {
		margin: 0;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		text-align: center;
		color: var(--nc-text-muted);
	}

	.note {
		margin: 0;
		font-size: 0.6875rem;
		font-style: italic;
		line-height: 1.3;
		text-align: center;
		color: var(--nc-text-muted);
	}
</style>

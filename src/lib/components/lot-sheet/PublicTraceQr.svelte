<script lang="ts">
	import { base } from '$app/paths';

	type Props = {
		lotId: string;
	};

	let { lotId }: Props = $props();

	// Le PNG est deja servi par /fiche-lot/[lotId]/label : il encode le GS1 Digital Link (gtin + lot).
	// Scanne, il ouvre la fiche publique consommateur. On reconstruit juste le chemin, base comprise.
	const src = $derived(`${base}/fiche-lot/${encodeURIComponent(lotId)}/label`);
</script>

<!-- Pose dans l'en-tete de la fiche, a l'oppose du titre : le QR seul, sans carte ni legende. -->
<img class="qr" {src} alt="QR code de traçabilité publique du lot" width="118" height="118" />

<style>
	.qr {
		display: block;
		width: 118px;
		height: 118px;
		flex-shrink: 0;
		image-rendering: pixelated;
	}
</style>

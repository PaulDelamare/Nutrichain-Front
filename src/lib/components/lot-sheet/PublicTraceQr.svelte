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

<section class="card">
	<div class="head">
		<h3>Traçabilité publique</h3>
	</div>

	<img class="qr" {src} alt="QR code de traçabilité publique du lot" width="176" height="176" />

	<p class="hint">Scannez ce code pour ouvrir la fiche consommateur (origine, statut sanitaire).</p>

	{#if !liveForConsumer}
		<p class="note">La fiche publique s'affiche une fois le lot expédié.</p>
	{/if}
</section>

<style>
	.card {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.head {
		margin-bottom: 0.75rem;
	}

	.head h3 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.qr {
		display: block;
		width: 176px;
		height: 176px;
		margin: 0 auto;
		image-rendering: pixelated;
	}

	.hint {
		margin: 0.75rem 0 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
		text-align: center;
	}

	.note {
		margin: 0.5rem 0 0;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
		text-align: center;
		font-style: italic;
	}
</style>

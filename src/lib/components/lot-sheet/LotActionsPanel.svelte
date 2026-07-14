<script lang="ts">
	import { resolve } from '$app/paths';

	// Poste d'actions du lot : lever la quarantaine, déclencher un rappel, voir la
	// traçabilité — directement depuis la fiche, sans passer par les autres pages.
	interface ActionFeedback {
		released?: boolean;
		releaseError?: string;
		recall?: { blockedBatchesCount: number; affectedShipments: unknown[] };
		recallError?: string;
	}

	import type { LotStatus } from '$lib/types/lot';
	import { peutDeciderQualite, type KnownRole } from '$lib/config/roles';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';

	let {
		lotId,
		statut,
		form,
		role
	}: {
		lotId: string;
		// Statut métier du lot : conforme (EN_STOCK), quarantaine (BLOQUE), surveillance (ALERTE = déjà rappelé),
		// et périmé / expédié / inconnu — tous rappelables (un lot déjà parti est justement celui qu'on rappelle).
		statut: LotStatus;
		form: ActionFeedback | null;
		/** REQUIS : optionnel = `undefined` = aucune restriction. Un oubli ouvrirait tout en silence. */
		role: KnownRole;
	} = $props();

	// Lever une quarantaine et déclencher un rappel sont des décisions qualité : l'opérateur en est
	// exclu. Le CONTEXTE reste affiché — il doit comprendre l'état du lot, pas seulement subir un
	// bouton manquant.
	const peutDecider = $derived(peutDeciderQualite(role));
</script>

<section class="panel">
	<h3>Actions</h3>

	{#if statut === 'quarantaine'}
		<!-- Lot bloqué (quarantaine qualité) : seule la levée a du sens. -->
		<div class="action">
			<p class="action-title">Lever la quarantaine</p>
			<p class="action-hint">Décision qualité — motif obligatoire, tracé dans l'audit WORM.</p>
			{#if peutDecider}
				<form method="POST" action="?/release">
					<input
						type="text"
						name="motif"
						placeholder="Motif (ex. 2ᵉ contrôle conforme)"
						required
						minlength="3"
					/>
					<button type="submit" class="ok">Lever la quarantaine</button>
				</form>
			{:else}
				<ActionReservee action="La levée de quarantaine" {role} />
			{/if}
			{#if form?.released}
				<p class="feedback ok" role="status">✅ Quarantaine levée — lot remis en stock.</p>
			{:else if form?.releaseError}
				<p class="feedback err" role="status">❌ {form.releaseError}</p>
			{/if}
		</div>
	{:else if statut === 'surveillance'}
		<!-- Lot déjà sous rappel (ALERTE) : aucun nouveau rappel, on ne rejoue pas l'action. -->
		<div class="action">
			<p class="action-title">Rappel en cours</p>
			<p class="action-hint">
				Ce lot et sa descendance sont déjà sous rappel (statut alerte). Suivez l'avancement depuis
				la page Rappels produits.
			</p>
		</div>
	{:else}
		<!-- Lot conforme : on peut déclencher un rappel (qui passe le lot et sa descendance en alerte). -->
		<div class="action">
			<p class="action-title">Déclencher un rappel</p>
			<p class="action-hint">
				Place le lot et toute sa descendance sous rappel (alerte) et notifie les expéditions
				parties.
			</p>
			{#if peutDecider}
				<form method="POST" action="?/recall">
					<input
						type="text"
						name="reason"
						placeholder="Motif (ex. contamination suspectée)"
						required
						minlength="3"
					/>
					<button type="submit" class="danger">Déclencher le rappel</button>
				</form>
			{:else}
				<ActionReservee action="Le déclenchement d'un rappel produit" {role} />
			{/if}
			{#if form?.recallError}
				<p class="feedback err" role="status">❌ {form.recallError}</p>
			{/if}
		</div>
	{/if}

	{#if form?.recall}
		<p class="feedback ok" role="status">
			✅ Rappel exécuté — {form.recall.blockedBatchesCount} lot(s) impacté(s), {form.recall
				.affectedShipments.length} expédition(s) à notifier. Le lot est maintenant sous rappel.
		</p>
	{/if}

	<form method="GET" action={resolve('/tracabilite')} class="trace-form">
		<input type="hidden" name="lot" value={lotId} />
		<button type="submit" class="trace-link">Voir la traçabilité (amont / aval) →</button>
	</form>
</section>

<style>
	.panel {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	h3 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.action {
		padding: 0.75rem 0;
		border-top: 1px solid #f1f5f9;
	}

	.action:first-of-type {
		border-top: none;
		padding-top: 0;
	}

	.action-title {
		margin: 0 0 0.15rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nc-text);
	}

	.action-hint {
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	form {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	input {
		flex: 1 1 14rem;
		min-width: 0;
		padding: 0.45rem 0.6rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}

	button {
		padding: 0.45rem 0.8rem;
		border: none;
		border-radius: 0.375rem;
		color: #fff;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}

	button.ok {
		background: var(--nc-brand-dark);
	}

	button.ok:hover {
		background: var(--nc-brand-hover);
	}

	button.danger {
		background: #b91c1c;
	}

	button.danger:hover {
		background: #991b1b;
	}

	.feedback {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
	}

	.feedback.ok {
		color: #166534;
	}

	.feedback.err {
		color: #991b1b;
	}

	.trace-form {
		margin-top: 0.75rem;
	}

	.trace-link {
		padding: 0;
		border: none;
		background: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nc-brand);
		cursor: pointer;
	}

	.trace-link:hover {
		color: var(--nc-brand-hover);
		text-decoration: underline;
	}
</style>

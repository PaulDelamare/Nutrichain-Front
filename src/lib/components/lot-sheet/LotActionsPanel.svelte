<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ApiRecallResult } from '$lib/Api/traceability.server';
	import type { LotStatus } from '$lib/types/lot';
	import { peutDeciderQualite, type KnownRole } from '$lib/config/roles';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';
	import RecallResult from '$lib/components/recall/RecallResult.svelte';

	interface ActionFeedback {
		released?: boolean;
		releaseError?: string;
		qualityReleased?: boolean;
		statutRestaure?: string;
		qualityReleaseError?: string;
		recall?: ApiRecallResult;
		recallError?: string;
		scrapped?: boolean;
		scrapError?: string;
	}

	let {
		lotId,
		statut,
		form,
		role
	}: {
		lotId: string;
		statut: LotStatus;
		form: ActionFeedback | null;
		role: KnownRole;
	} = $props();

	const peutDecider = $derived(peutDeciderQualite(role));

	/** Les deux seuls états où l'API accepte la mise au rebut. */
	const peutMettreAuRebut = $derived(statut === 'quarantaine' || statut === 'surveillance');

	/**
	 * Geste irréversible : la quantité tombe à zéro et aucune route ne le défait. Le lot est nommé
	 * dans la demande, parce qu'on arrive ici depuis une liste et qu'on peut s'être trompé de fiche.
	 */
	function confirmScrap(event: SubmitEvent) {
		if (!confirm(`Mettre le lot ${lotId} au rebut ? La marchandise sera déclarée détruite.`)) {
			event.preventDefault();
		}
	}
</script>

<section class="panel">
	<h3>Actions</h3>

	<!--
		Les confirmations vivent HORS des blocs conditionnés au statut : une action réussie change
		précisément ce statut, le bloc qui la portait disparaît, et l'utilisateur ne voyait jamais que
		son geste avait abouti. Les erreurs, elles, restent dans leur bloc — en cas d'échec le statut
		n'a pas bougé, et le message doit rester près du champ qui l'a produit.
	-->
	{#if form?.qualityReleased}
		<p class="feedback ok" role="status">
			✅ Quarantaine qualité levée — lot revenu en « {form.statutRestaure ?? 'son statut d’avant'}
			».
		</p>
	{/if}
	{#if form?.released}
		<p class="feedback ok" role="status">✅ Quarantaine froid levée.</p>
	{/if}
	{#if form?.scrapped}
		<p class="feedback ok" role="status">✅ Lot mis au rebut — quantité ramenée à zéro.</p>
	{/if}

	{#if statut === 'quarantaine'}
		<div class="action">
			<p class="action-title">Lever la quarantaine froid</p>
			<p class="action-hint">
				Pour un lot isolé par une excursion de température, une fois l'incident traité. Un lot
				retenu par un contrôle non conforme n'est pas levable ici — motif obligatoire, tracé dans
				l'historique du lot.
			</p>
			{#if peutDecider}
				<form method="POST" action="?/release">
					<input
						type="text"
						name="motif"
						placeholder="Motif (ex. chambre froide réparée, relevés conformes)"
						required
						minlength="3"
					/>
					<button type="submit" class="ok">Lever la quarantaine froid</button>
				</form>
			{:else}
				<ActionReservee action="La levée de quarantaine froid" {role} />
			{/if}
			{#if form?.releaseError}
				<p class="feedback err" role="status">❌ {form.releaseError}</p>
			{/if}
		</div>
		<div class="action">
			<p class="action-title">Lever la quarantaine qualité</p>
			<p class="action-hint">
				Pour un lot retenu par un contrôle NON CONFORME. Enregistrez d'abord la contre-analyse
				conforme depuis le contrôle qualité : l'API l'exige comme preuve, le motif ne la remplace
				pas. Le lot revient à son statut d'avant le blocage, pas en stock.
			</p>
			{#if peutDecider}
				<form method="POST" action="?/qualityRelease">
					<input
						type="text"
						name="motif"
						placeholder="Motif (ex. contre-analyse microbiologique conforme)"
						required
						minlength="3"
					/>
					<button type="submit" class="ok">Lever la quarantaine qualité</button>
				</form>
			{:else}
				<ActionReservee action="La levée de quarantaine qualité" {role} />
			{/if}
			{#if form?.qualityReleaseError}
				<p class="feedback err" role="status">❌ {form.qualityReleaseError}</p>
			{/if}
		</div>
	{:else if statut === 'surveillance' && !form?.recall}
		<div class="action">
			<p class="action-title">Rappel en cours</p>
			<p class="action-hint">
				Ce lot et sa descendance sont déjà sous rappel (statut alerte). Suivez l'avancement depuis
				la page Rappels produits.
			</p>
		</div>
	{:else if statut !== 'surveillance'}
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

	{#if peutMettreAuRebut}
		<div class="action">
			<p class="action-title">Mettre au rebut</p>
			<p class="action-hint">
				{statut === 'quarantaine'
					? 'La marchandise n’est pas récupérable : elle quitte définitivement la chaîne. C’est la seule sortie d’un lot bloqué.'
					: 'Le stock de ce lot resté chez nous quitte définitivement la chaîne. Le retrait des rayons, lui, se déclare par expédition.'}
			</p>
			{#if peutDecider}
				<form method="POST" action="?/scrap" onsubmit={confirmScrap}>
					<input
						type="text"
						name="motif"
						placeholder="Motif (ex. rupture de chaîne du froid de 4 h)"
						required
						minlength="3"
						maxlength="500"
					/>
					<button type="submit" class="danger">Mettre au rebut</button>
				</form>
			{:else}
				<ActionReservee action="La mise au rebut" {role} />
			{/if}
			{#if form?.scrapError}
				<p class="feedback err" role="status">❌ {form.scrapError}</p>
			{/if}
		</div>
	{/if}

	{#if form?.recall}
		<RecallResult recall={form.recall} />
	{/if}

	<form method="GET" action={resolve('/tracabilite')} class="trace-form">
		<input type="hidden" name="lot" value={lotId} />
		<button type="submit" class="trace-link">Voir la traçabilité (amont / aval) →</button>
	</form>

	<p class="label-row">
		<a
			href={resolve('/(app)/fiche-lot/[lotId]/label', { lotId: encodeURIComponent(lotId) })}
			target="_blank"
			rel="noopener noreferrer"
		>
			Imprimer l'étiquette QR →
		</a>
	</p>
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

	.label-row {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
	}

	.label-row a {
		color: var(--nc-brand);
		font-weight: 500;
		text-decoration: none;
	}

	.label-row a:hover {
		text-decoration: underline;
	}
</style>

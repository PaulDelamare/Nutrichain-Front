<script lang="ts">
	import type { PendingQcLot } from '$lib/types/quality';
	import { peutDeciderQualite, type KnownRole } from '$lib/config/roles';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';

	type Props = {
		lots: PendingQcLot[];
		/** Lot dont la saisie vient d'échouer, avec le message de l'API. */
		errorLotId?: string;
		errorMessage?: string;
		/** REQUIS : optionnel = `undefined` = aucune restriction. Un oubli ouvrirait tout en silence. */
		role: KnownRole;
	};

	let { lots, errorLotId, errorMessage, role }: Props = $props();

	// La liste des lots bloqués reste visible : c'est une information de production, utile à
	// l'opérateur. Seule la SAISIE du contrôle est une décision qualité.
	const peutControler = $derived(peutDeciderQualite(role));

	// Un seul formulaire ouvert à la fois : la page ne doit pas devenir un mur de champs.
	let openLot = $state<string | null>(null);
</script>

<section class="card">
	<h3>Lots en attente de contrôle</h3>
	<p class="hint">
		Un produit fini ne peut ni être expédié ni transformé tant qu'un contrôle ne l'a pas libéré.
	</p>

	{#if lots.length === 0}
		<p class="empty">Aucun lot en attente de contrôle.</p>
	{:else}
		<ul>
			{#each lots as lot (lot.id)}
				<li>
					<div class="row">
						<div>
							<p class="lot">{lot.lot}</p>
							<p class="detail">{lot.produit} · {lot.quantite} · {lot.depuis}</p>
						</div>
						{#if peutControler}
							<button
								type="button"
								class="open"
								onclick={() => (openLot = openLot === lot.id ? null : lot.id)}
							>
								{openLot === lot.id ? 'Annuler' : 'Saisir le contrôle'}
							</button>
						{/if}
					</div>

					{#if errorLotId === lot.id && errorMessage}
						<p class="err" role="status">❌ {errorMessage}</p>
					{/if}

					{#if openLot === lot.id && peutControler}
						<form method="POST" action="?/control" class="form">
							<input type="hidden" name="lotId" value={lot.id} />

							<label>
								<span>Type de test</span>
								<input
									type="text"
									name="typeTest"
									placeholder="Ex. : analyse microbiologique"
									required
									minlength="3"
								/>
							</label>

							<label>
								<span>Notes (facultatif)</span>
								<input type="text" name="notes" placeholder="Ex. : Listeria négatif" />
							</label>

							<div class="actions">
								<button type="submit" name="resultat" value="CONFORME" class="conforme">
									Conforme — libérer le lot
								</button>
								<button type="submit" name="resultat" value="NON_CONFORME" class="non-conforme">
									Non conforme — mettre en quarantaine
								</button>
							</div>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	{#if !peutControler && lots.length > 0}
		<ActionReservee action="La saisie d'un contrôle qualité" {role} />
	{/if}
</section>

<style>
	.card {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.card h3 {
		margin: 0 0 0.25rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.hint {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.empty {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 0.75rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	li:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.lot {
		margin: 0 0 0.1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.detail {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}

	.open {
		flex-shrink: 0;
		padding: 0.35rem 0.75rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.open:hover {
		background: #f8fafc;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.375rem;
		background: #f8fafc;
	}

	.form label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}

	.form input {
		padding: 0.4rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.actions button {
		padding: 0.45rem 0.8rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #fff;
		cursor: pointer;
	}

	.conforme {
		background: var(--nc-brand-dark, #1b6b5c);
	}

	.non-conforme {
		background: #ef4444;
	}

	.err {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: #991b1b;
	}
</style>

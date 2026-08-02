<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ApiShelfWithdrawalProgress } from '$lib/Api/logistics.server';
	import { canRecordShelfWithdrawal, type KnownRole } from '$lib/config/roles';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';

	let {
		magasins,
		role,
		erreur
	}: {
		magasins: ApiShelfWithdrawalProgress[];
		role: KnownRole;
		erreur?: string;
	} = $props();

	// Miroir de la garde serveur, qui est elle-même celle de l'API : masquer une action que le
	// serveur accepterait est aussi faux que d'en montrer une qu'il refuse.
	const canRecord = $derived(canRecordShelfWithdrawal(role));

	let openFor = $state<string | null>(null);

	const reste = (magasin: ApiShelfWithdrawalProgress) => Number(magasin.resteARetirer);
</script>

<section class="panel">
	<h3>Retraits en magasin</h3>

	{#if magasins.length === 0}
		<p class="empty">
			Aucune livraison constatée pour ce lot : il n'y a rien à retirer d'un rayon. Confirmez d'abord
			l'arrivée d'une expédition.
		</p>
	{:else}
		{#if erreur}
			<p class="error" role="alert">{erreur}</p>
		{/if}

		<ul class="stores">
			{#each magasins as magasin (magasin.customerId)}
				<li class="store">
					<div class="store-head">
						<strong>{magasin.customerName}</strong>
						<span class="figures">
							{magasin.quantiteRetiree} / {magasin.quantiteLivree}
							{magasin.unite} retirés
						</span>
					</div>

					{#if reste(magasin) <= 0}
						<p class="done">Retrait complet — plus rien en rayon.</p>
					{:else}
						<p class="left">Reste à retirer : {magasin.resteARetirer} {magasin.unite}</p>

						{#if canRecord}
							{#if openFor === magasin.customerId}
								<form method="POST" action="?/withdraw" use:enhance>
									<input type="hidden" name="id_client" value={magasin.customerId} />
									<label>
										<span>Quantité retirée ({magasin.unite})</span>
										<input
											type="number"
											name="quantite"
											step="0.001"
											min="0.001"
											max={magasin.resteARetirer}
											required
										/>
									</label>
									<label>
										<span>Motif</span>
										<input type="text" name="motif" minlength="5" maxlength="500" required />
									</label>
									<label>
										<span>Constaté auprès de (facultatif)</span>
										<input type="text" name="constate_aupres_de" maxlength="120" />
									</label>
									<div class="actions">
										<button type="submit" class="btn">Enregistrer le retrait</button>
										<button type="button" class="btn-ghost" onclick={() => (openFor = null)}>
											Annuler
										</button>
									</div>
								</form>
							{:else}
								<button type="button" class="btn" onclick={() => (openFor = magasin.customerId)}>
									Déclarer un retrait
								</button>
							{/if}
						{/if}
					{/if}

					{#if magasin.retraits.length > 0}
						<ul class="history">
							{#each magasin.retraits as retrait (retrait.id)}
								<li>
									{retrait.quantite}
									{magasin.unite} — {retrait.motif}{retrait.constateAupresDe
										? ` · constaté auprès de ${retrait.constateAupresDe}`
										: ''}
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>

		{#if !canRecord}
			<ActionReservee action="L'enregistrement d'un retrait en magasin" {role} />
		{/if}
	{/if}
</section>

<style>
	.panel {
		padding: 1.25rem 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.panel h3 {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.stores {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.store {
		padding: 0.75rem 0.875rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
	}

	.store-head {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: baseline;
		margin-bottom: 0.35rem;
	}

	.figures,
	.left,
	.done,
	.empty {
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.done {
		color: #15803d;
	}

	.left,
	.done {
		margin: 0 0 0.5rem;
	}

	.empty {
		margin: 0;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	input {
		padding: 0.4rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.45rem 0.9rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.btn-ghost {
		padding: 0.45rem 0.9rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.history {
		list-style: none;
		margin: 0.6rem 0 0;
		padding: 0.6rem 0 0;
		border-top: 1px dashed #e2e8f0;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}

	.error {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fee2e2;
		color: #991b1b;
		font-size: 0.8125rem;
	}
</style>

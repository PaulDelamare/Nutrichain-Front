<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let envoi = $state(false);
	const pendant = () => {
		envoi = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			envoi = false;
		};
	};
</script>

<PageHead
	heading="Configuration de l'usine"
	description="Emplacements et fournisseurs — les données de référence sans lesquelles aucune réception n'est possible."
/>

{#if data.error}
	<p class="banner">Chargement partiel — {data.error}</p>
{/if}

<div class="grid">
	<!-- Emplacements -->
	<section>
		<h2>Emplacements</h2>
		<p class="hint">Quais, chambres froides, zones de production. Requis pour créer un matériel.</p>

		<form method="POST" action="?/createLocation" use:enhance={pendant}>
			<input
				name="nom"
				placeholder="Nom (ex. Chambre froide A)"
				required
				minlength="2"
				value={form?.nom ?? ''}
			/>
			<input name="type" placeholder="Type (ex. COLD_STORAGE)" required minlength="2" />
			<input name="description" placeholder="Description (optionnel)" />
			<button type="submit" disabled={envoi}>Ajouter</button>
		</form>
		{#if form?.locationError}
			<p class="error" role="alert">{form.locationError}</p>
		{/if}

		<ul>
			{#each data.locations as loc (loc.id)}
				<li class:archived={!loc.is_active}>
					<div>
						<span class="nom">{loc.nom}</span>
						<span class="meta">{loc.type}</span>
						{#if !loc.is_active}<span class="tag">Archivé</span>{/if}
					</div>
					<form method="POST" action="?/toggleLocation" use:enhance={pendant}>
						<input type="hidden" name="id" value={loc.id} />
						<input type="hidden" name="active" value={String(!loc.is_active)} />
						<button type="submit" class="link" disabled={envoi}>
							{loc.is_active ? 'Archiver' : 'Réactiver'}
						</button>
					</form>
				</li>
			{:else}
				<li class="empty">Aucun emplacement. Ajoutez-en un pour créer du matériel.</li>
			{/each}
		</ul>
	</section>

	<!-- Fournisseurs -->
	<section>
		<h2>Fournisseurs</h2>
		<p class="hint">L'amont de la traçabilité. Requis pour enregistrer une réception.</p>

		<form method="POST" action="?/createSupplier" use:enhance={pendant}>
			<input
				name="nom_ferme"
				placeholder="Nom (ex. Ferme des Aubépines)"
				required
				minlength="2"
				value={form?.nom_ferme ?? ''}
			/>
			<input name="adresse_siege" placeholder="Adresse du siège" required minlength="2" />
			<input name="type_produit" placeholder="Type de produit (optionnel)" />
			<button type="submit" disabled={envoi}>Ajouter</button>
		</form>
		{#if form?.supplierError}
			<p class="error" role="alert">{form.supplierError}</p>
		{/if}

		<ul>
			{#each data.suppliers as sup (sup.id)}
				<li class:archived={!sup.is_active}>
					<div>
						<span class="nom">{sup.nom_ferme}</span>
						<span class="meta">{sup.adresse_siege}</span>
						{#if !sup.is_active}<span class="tag">Archivé</span>{/if}
					</div>
					<form method="POST" action="?/toggleSupplier" use:enhance={pendant}>
						<input type="hidden" name="id" value={sup.id} />
						<input type="hidden" name="active" value={String(!sup.is_active)} />
						<button type="submit" class="link" disabled={envoi}>
							{sup.is_active ? 'Archiver' : 'Réactiver'}
						</button>
					</form>
				</li>
			{:else}
				<li class="empty">Aucun fournisseur. Ajoutez-en un pour réceptionner.</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
		gap: 1rem;
		align-items: start;
	}

	section {
		padding: 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.hint {
		margin: 0.25rem 0 1rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	input {
		flex: 1 1 8rem;
		min-width: 0;
		padding: 0.45rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	button {
		padding: 0.45rem 0.9rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark, #1b6b5c);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	button.link {
		background: none;
		color: var(--nc-text-muted);
		padding: 0;
		font-size: 0.8125rem;
		text-decoration: underline;
	}

	ul {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	li:last-child {
		border-bottom: none;
	}

	li.archived .nom {
		color: var(--nc-text-subtle);
		text-decoration: line-through;
	}

	.nom {
		font-weight: 500;
		color: var(--nc-text);
	}

	.meta {
		margin-left: 0.5rem;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}

	.tag {
		margin-left: 0.5rem;
		padding: 0.1rem 0.45rem;
		border-radius: 9999px;
		background: #f1f5f9;
		color: var(--nc-text-muted);
		font-size: 0.7rem;
	}

	.empty {
		color: var(--nc-text-subtle);
		font-size: 0.875rem;
		justify-content: flex-start;
	}

	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

	.error {
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
		color: #991b1b;
	}
</style>

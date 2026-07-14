<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import ConfigList from '$lib/components/config/ConfigList.svelte';
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
	description="Les données de référence de votre organisation : emplacements, fournisseurs, clients, produits. Sans elles, aucune réception ni expédition n'est possible."
/>

{#if data.error}
	<p class="banner">Chargement partiel — {data.error}</p>
{/if}

<div class="grid">
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
		{#if form?.locationError}<p class="error" role="alert">{form.locationError}</p>{/if}
		<ConfigList
			items={data.locations.map((l) => ({
				id: l.id,
				title: l.nom,
				subtitle: l.type,
				is_active: l.is_active
			}))}
			toggleAction="?/toggleLocation"
			emptyLabel="Aucun emplacement. Ajoutez-en un pour créer du matériel."
			{envoi}
			{pendant}
		/>
	</section>

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
		{#if form?.supplierError}<p class="error" role="alert">{form.supplierError}</p>{/if}
		<ConfigList
			items={data.suppliers.map((s) => ({
				id: s.id,
				title: s.nom_ferme,
				subtitle: s.adresse_siege,
				is_active: s.is_active
			}))}
			toggleAction="?/toggleSupplier"
			emptyLabel="Aucun fournisseur. Ajoutez-en un pour réceptionner."
			{envoi}
			{pendant}
		/>
	</section>

	<section>
		<h2>Clients</h2>
		<p class="hint">L'aval de la traçabilité. Requis pour enregistrer une expédition.</p>
		<form method="POST" action="?/createCustomer" use:enhance={pendant}>
			<input
				name="nom_enseigne"
				placeholder="Enseigne (ex. Super U Rennes)"
				required
				minlength="2"
				value={form?.nom_enseigne ?? ''}
			/>
			<input name="adresse_livraison" placeholder="Adresse de livraison" required minlength="2" />
			<input name="email" type="email" placeholder="E-mail (optionnel)" />
			<button type="submit" disabled={envoi}>Ajouter</button>
		</form>
		{#if form?.customerError}<p class="error" role="alert">{form.customerError}</p>{/if}
		<ConfigList
			items={data.customers.map((c) => ({
				id: c.id,
				title: c.nom_enseigne,
				subtitle: c.adresse_livraison,
				is_active: c.is_active
			}))}
			toggleAction="?/toggleCustomer"
			emptyLabel="Aucun client. Ajoutez-en un pour expédier."
			{envoi}
			{pendant}
		/>
	</section>

	<section>
		<h2>Produits</h2>
		<p class="hint">Le catalogue. Requis pour réceptionner et pour produire (transformation).</p>
		<form method="POST" action="?/createProduct" use:enhance={pendant} class="produit">
			<input
				name="nom"
				placeholder="Nom (ex. Yaourt nature 125g)"
				required
				minlength="2"
				value={form?.nom ?? ''}
			/>
			<input
				name="code_gtin"
				placeholder="Code GTIN (8 à 14 chiffres)"
				required
				inputmode="numeric"
			/>
			<input name="categorie" placeholder="Catégorie (ex. Frais)" required minlength="2" />
			<input name="unite_reference" placeholder="Unité (ex. KG)" required />
			<input
				name="duree_conservation_defaut"
				type="number"
				min="0"
				placeholder="Conservation (jours)"
				required
			/>
			<input
				name="seuil_alerte_stock"
				type="number"
				min="0"
				step="0.01"
				placeholder="Seuil d'alerte stock"
				required
			/>
			<button type="submit" disabled={envoi}>Ajouter</button>
		</form>
		{#if form?.productError}<p class="error" role="alert">{form.productError}</p>{/if}
		<ConfigList
			items={data.products.map((p) => ({
				id: p.id,
				title: p.nom,
				subtitle: `${p.code_gtin} · ${p.categorie}`,
				is_active: p.is_active
			}))}
			toggleAction="?/toggleProduct"
			emptyLabel="Aucun produit. Ajoutez-en un pour réceptionner ou produire."
			{envoi}
			{pendant}
		/>
	</section>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(23rem, 1fr));
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

	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

	.error {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: #991b1b;
	}
</style>

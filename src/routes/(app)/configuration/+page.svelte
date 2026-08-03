<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import ConfigList from '$lib/components/config/ConfigList.svelte';
	import ImportCsv from '$lib/components/config/ImportCsv.svelte';
	import LocationsListing from '$lib/components/config/LocationsListing.svelte';
	import SupplierListing from '$lib/components/config/SupplierListing.svelte';
	import CustomerListing from '$lib/components/config/CustomerListing.svelte';
	import {
		COLD_EQUIPMENT_TYPES,
		EQUIPMENT_TYPE_OPTIONS,
		equipmentTypeLabel,
		type EquipmentType
	} from '$lib/config/equipment';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Emplacements actifs pour le sélecteur de la modale Matériel (chargés à part par le load quand
	// l'onglet Matériel est actif). Les autres onglets sont vides ⇒ tableau vide masqué.
	const activeLocations = $derived(data.activeLocations);

	// Le résultat d'un import CSV est routé vers l'onglet (produits / clients) qui l'a déclenché.
	const importReportFor = (kind: 'products' | 'customers') =>
		(form && 'importReport' in form && form.importKind === kind ? form.importReport : null) ?? null;
	const importErrorFor = (kind: 'products' | 'customers') =>
		(form && 'importError' in form && 'importKind' in form && form.importKind === kind
			? form.importError
			: null) ?? null;

	let envoi = $state(false);
	let typeMateriel = $state<EquipmentType>('FRIGO');
	const seuilRequis = $derived(COLD_EQUIPMENT_TYPES.includes(typeMateriel));
	const pendant = () => {
		envoi = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			envoi = false;
		};
	};

	type TabId = 'locations' | 'suppliers' | 'customers' | 'products' | 'equipment';

	// Onglets = navigation URL : le load ne charge que l'onglet actif, donc changer d'onglet
	// recharge (et remet pagination/filtres à zéro). L'onglet actif vient de l'URL, pas d'un état.
	function selectTab(id: TabId) {
		if (id === data.activeTab) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/configuration')}?tab=${id}`, { noScroll: true, keepFocus: true });
	}

	// Le compteur affiche le total du référentiel (un seul appel dédié, indépendant de la page).
	const tabs = $derived([
		{ id: 'locations' as TabId, label: 'Emplacements', count: data.counts.locations },
		{ id: 'suppliers' as TabId, label: 'Fournisseurs', count: data.counts.suppliers },
		{ id: 'customers' as TabId, label: 'Clients', count: data.counts.customers },
		{ id: 'products' as TabId, label: 'Produits', count: data.counts.products },
		{ id: 'equipment' as TabId, label: 'Matériel', count: data.counts.equipment }
	]);
</script>

<PageHead
	heading="Configuration de l'usine"
	description="Les données de référence de votre organisation : emplacements, fournisseurs, clients, produits. Sans elles, aucune réception ni expédition n'est possible."
/>

{#if data.error}
	<p class="banner">Chargement partiel — {data.error}</p>
{/if}

<div class="tabs">
	<Tabs value={data.activeTab} onValueChange={(e) => selectTab(e.value as TabId)}>
		<Tabs.List>
			{#each tabs as tab (tab.id)}
				<Tabs.Trigger value={tab.id}>
					{tab.label}
					<span class="tab-count">{tab.count}</span>
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		<Tabs.Content value="locations">
			<LocationsListing
				locations={data.locations}
				filters={data.locationFilters}
				pageSize={data.pageSize}
				pageSizeOptions={data.pageSizeOptions}
				{form}
				role={data.user.role}
			/>
		</Tabs.Content>

		<Tabs.Content value="suppliers">
			<SupplierListing
				suppliers={data.suppliers}
				filters={data.supplierFilters}
				pageSize={data.pageSize}
				pageSizeOptions={data.pageSizeOptions}
				{form}
				role={data.user.role}
			/>
		</Tabs.Content>

		<Tabs.Content value="customers">
			<CustomerListing
				customers={data.customers}
				filters={data.customerFilters}
				pageSize={data.pageSize}
				pageSizeOptions={data.pageSizeOptions}
				{form}
				role={data.user.role}
			/>
			<div class="import-block">
				<ImportCsv
					action="?/importCustomers"
					columns="nom_enseigne, adresse_livraison, email, contact_urgence"
					report={importReportFor('customers')}
					error={importErrorFor('customers')}
					{envoi}
					{pendant}
				/>
			</div>
		</Tabs.Content>

		<Tabs.Content value="products">
			<section>
				<h2>Produits</h2>
				<p class="hint">
					Le catalogue. Requis pour réceptionner et pour produire (transformation).
				</p>
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
				<ImportCsv
					action="?/importProducts"
					columns="nom, code_gtin, categorie, duree_conservation_defaut, seuil_alerte_stock, unite_reference"
					report={importReportFor('products')}
					error={importErrorFor('products')}
					{envoi}
					{pendant}
				/>
			</section>
		</Tabs.Content>

		<Tabs.Content value="equipment">
			<section>
				<h2>Matériel</h2>
				<p class="hint">
					Frigos, congélateurs, cuves… rattachés à un emplacement. Requis pour réceptionner et pour
					la surveillance IoT. Imprimez l'étiquette QR après création.
				</p>
				{#if activeLocations.length === 0}
					<p class="hint">Créez d'abord un emplacement actif pour pouvoir ajouter du matériel.</p>
				{:else}
					<form method="POST" action="?/createEquipment" use:enhance={pendant}>
						<input
							name="nom"
							placeholder="Nom (ex. Frigo réception A)"
							required
							minlength="3"
							value={form?.nom ?? ''}
						/>
						<select name="type" bind:value={typeMateriel} aria-label="Type de matériel">
							{#each EQUIPMENT_TYPE_OPTIONS as opt (opt.value)}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						<select name="id_lieu" required aria-label="Emplacement">
							{#each activeLocations as lieu (lieu.id)}
								<option value={lieu.id}>{lieu.nom}</option>
							{/each}
						</select>
						<input
							name="temp_seuil_max"
							type="number"
							step="0.1"
							placeholder={seuilRequis ? 'Seuil max °C (requis)' : 'Seuil max °C (optionnel)'}
							required={seuilRequis}
						/>
						<input name="sensor_id" placeholder="ID capteur IoT (optionnel)" />
						<button type="submit" disabled={envoi}>Ajouter</button>
					</form>
				{/if}
				{#if form?.equipmentError}<p class="error" role="alert">{form.equipmentError}</p>{/if}
				<ul class="equip-list">
					{#each data.equipment as item (item.id)}
						<li>
							<div>
								<span class="title">{item.nom}</span>
								<span class="sub">
									{equipmentTypeLabel(item.type)}
									{#if item.lieu?.nom}· {item.lieu.nom}{/if}
									{#if item.temp_seuil_max != null}· seuil {item.temp_seuil_max} °C{/if}
									· {item.statut}
								</span>
							</div>
							<a
								class="label-link"
								href={resolve('/(app)/configuration/equipment/[id]/label', {
									id: encodeURIComponent(item.id)
								})}
								target="_blank"
								rel="noopener"
							>
								Étiquette QR
							</a>
						</li>
					{:else}
						<li class="empty">
							Aucun matériel. Ajoutez-en un pour réceptionner et suivre le froid.
						</li>
					{/each}
				</ul>
			</section>
		</Tabs.Content>
	</Tabs>
</div>

<style>
	/* Le composant Tabs (Skeleton/Zag) est livre sans style : on l'habille avec la charte --nc-*.
	   Les elements sont rendus par le composant enfant, donc on cible ses hooks (role, data-*, aria)
	   via :global sous le conteneur scope .tabs pour ne pas fuir sur le reste de l'app. */
	.tabs :global([role='tablist']) {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid #e2e8f0;
		overflow-x: auto;
	}

	.tabs :global([role='tab']) {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		flex-shrink: 0;
		margin-bottom: -1px;
		padding: 0.6rem 0.9rem;
		border: none;
		border-bottom: 2px solid transparent;
		background: none;
		font: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		color: var(--nc-text-muted);
		cursor: pointer;
	}

	.tabs :global([role='tab']:hover) {
		color: var(--nc-text);
	}

	.tabs :global([role='tab'][data-selected]) {
		color: var(--nc-brand);
		border-bottom-color: var(--nc-brand);
	}

	.tabs :global([role='tab']:focus-visible) {
		outline: 2px solid var(--nc-brand-ring);
		outline-offset: -2px;
		border-radius: 0.25rem;
	}

	.tabs :global(.tab-count) {
		min-width: 1.35rem;
		padding: 0.05rem 0.35rem;
		border-radius: 999px;
		background: #f1f5f9;
		color: var(--nc-text-subtle);
		font-size: 0.75rem;
		font-weight: 600;
		text-align: center;
	}

	.tabs :global([role='tab'][data-selected] .tab-count) {
		background: var(--nc-brand-soft);
		color: var(--nc-brand);
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

	input,
	select {
		flex: 1 1 8rem;
		min-width: 0;
		padding: 0.45rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: #fff;
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

	/* Import CSV rendu sous le tableau/filtres de l'onglet (clients, produits). */
	.import-block {
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid #e2e8f0;
	}

	.equip-list {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
	}

	.equip-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.equip-list li:last-child {
		border-bottom: none;
	}

	.title {
		font-weight: 500;
		color: var(--nc-text);
	}

	.sub {
		margin-left: 0.5rem;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}

	.empty {
		justify-content: flex-start;
		color: var(--nc-text-subtle);
		font-size: 0.875rem;
	}

	.label-link {
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
		white-space: nowrap;
	}
</style>

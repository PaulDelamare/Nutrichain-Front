<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import ImportCsv from '$lib/components/config/ImportCsv.svelte';
	import LocationsListing from '$lib/components/config/LocationsListing.svelte';
	import SupplierListing from '$lib/components/config/SupplierListing.svelte';
	import CustomerListing from '$lib/components/config/CustomerListing.svelte';
	import ProductListing from '$lib/components/config/ProductListing.svelte';
	import EquipmentListing from '$lib/components/config/EquipmentListing.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Le résultat d'un import CSV est routé vers l'onglet (produits / clients) qui l'a déclenché.
	const importReportFor = (kind: 'products' | 'customers') =>
		(form && 'importReport' in form && form.importKind === kind ? form.importReport : null) ?? null;
	const importErrorFor = (kind: 'products' | 'customers') =>
		(form && 'importError' in form && 'importKind' in form && form.importKind === kind
			? form.importError
			: null) ?? null;

	// `pendant` / `envoi` : état d'envoi partagé par les imports CSV (clients, produits).
	let envoi = $state(false);
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
			<ProductListing
				products={data.products}
				filters={data.productFilters}
				pageSize={data.pageSize}
				pageSizeOptions={data.pageSizeOptions}
				{form}
				role={data.user.role}
			/>
			<div class="import-block">
				<ImportCsv
					action="?/importProducts"
					columns="nom, code_gtin, categorie, duree_conservation_defaut, seuil_alerte_stock, unite_reference"
					report={importReportFor('products')}
					error={importErrorFor('products')}
					{envoi}
					{pendant}
				/>
			</div>
		</Tabs.Content>

		<Tabs.Content value="equipment">
			<EquipmentListing
				equipment={data.equipment}
				filters={data.equipmentFilters}
				activeLocations={data.activeLocations}
				pageSize={data.pageSize}
				pageSizeOptions={data.pageSizeOptions}
				{form}
				role={data.user.role}
			/>
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

	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

	/* Import CSV rendu sous le tableau/filtres de l'onglet (clients, produits). */
	.import-block {
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid #e2e8f0;
	}
</style>

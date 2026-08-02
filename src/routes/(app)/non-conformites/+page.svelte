<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import NcPanel from '$lib/components/nc/NcPanel.svelte';
	import PendingQcPanel from '$lib/components/nc/PendingQcPanel.svelte';
	import QuarantinePanel from '$lib/components/nc/QuarantinePanel.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher NC, lot en attente, lot en quarantaine…');
		return () => pageSearch.deactivate();
	});

	const openNc = $derived(
		filterRowsByText(data.openNc, pageSearch.query, (r) => [r.id, r.type, r.lot, r.statut])
	);
	// On filtre sur ce qui est affiché : le numéro d'étiquette, plus l'UUID que la liste ne montre
	// plus (#81) — sinon une recherche « trouve » une ligne où rien ne correspond à l'œil.
	const quarantineLots = $derived(
		filterRowsByText(data.quarantineLots, pageSearch.query, (l) => [l.numero, l.detail])
	);
	const pendingQc = $derived(
		filterRowsByText(data.pendingQc, pageSearch.query, (l) => [l.lot, l.produit, l.quantite])
	);

	function exportList() {
		const header = 'Lot;Détail';
		const lines = data.quarantineLots.map((l) => `${l.numero};${l.detail.replaceAll(';', ',')}`);
		const csv = [header, ...lines].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `quarantaine-${new Date().toISOString().slice(0, 10)}.csv`;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	type TabId = 'pending' | 'nc' | 'quarantine';

	// Une action de levée renvoie l'utilisateur sur l'onglet quarantaine plutot que sur l'onglet
	// par defaut : sans use:enhance, la soumission recharge la page et remonte le composant.
	function initialTab(): TabId {
		if (form?.released || form?.releaseError) return 'quarantine';
		return 'pending';
	}

	let activeTab = $state<TabId>(initialTab());

	// Le compteur suit la liste filtree par la recherche : un onglet vide signale qu'il faut aller
	// voir ailleurs, sans quitter la page.
	const tabs = $derived([
		{ id: 'pending' as TabId, label: 'Lots en attente de contrôle', count: pendingQc.length },
		{ id: 'nc' as TabId, label: 'NC ouvertes', count: openNc.length },
		{ id: 'quarantine' as TabId, label: 'Lots en quarantaine', count: quarantineLots.length }
	]);
</script>

<PageHead
	heading="Non-conformités & quarantaine"
	description="Suivi des écarts, causes, actions correctives et lots bloqués."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

{#if form?.released}
	<p class="feedback ok" role="status">
		✅ Quarantaine levée — le lot est remis en stock (décision tracée dans l'audit).
	</p>
{:else if form?.releaseError}
	<p class="feedback err" role="status">❌ Levée impossible — {form.releaseError}</p>
{/if}

{#if form?.controlled}
	<p class="feedback ok" role="status">
		{#if form.statutLot === 'EN_STOCK'}
			✅ Contrôle conforme — le lot est libéré : il peut désormais être expédié.
		{:else}
			✅ Contrôle non conforme enregistré — le lot est placé en quarantaine.
		{/if}
	</p>
{/if}

{#if !data.error}
	<div class="tabs">
		<Tabs value={activeTab} onValueChange={(e) => (activeTab = e.value as TabId)}>
			<Tabs.List>
				{#each tabs as tab (tab.id)}
					<Tabs.Trigger value={tab.id}>
						{tab.label}
						<span class="tab-count">{tab.count}</span>
					</Tabs.Trigger>
				{/each}
			</Tabs.List>

			<Tabs.Content value="pending">
				<PendingQcPanel
					lots={pendingQc}
					errorLotId={form?.controlLotId}
					errorMessage={form?.controlError}
					role={data.user.role}
				/>
			</Tabs.Content>

			<Tabs.Content value="nc">
				<NcPanel rows={openNc} />
			</Tabs.Content>

			<Tabs.Content value="quarantine">
				<QuarantinePanel lots={quarantineLots} onexport={exportList} role={data.user.role} />
			</Tabs.Content>
		</Tabs>
	</div>
{/if}

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

	.feedback {
		margin: 0 0 0.75rem;
		padding: 0.625rem 0.875rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.feedback.ok {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.feedback.err {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}
</style>

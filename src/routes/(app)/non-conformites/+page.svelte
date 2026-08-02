<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import NcOpenListing from '$lib/components/nc/NcOpenListing.svelte';
	import PendingQcListing from '$lib/components/nc/PendingQcListing.svelte';
	import QuarantineListing from '$lib/components/nc/QuarantineListing.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PendingQcLot } from '$lib/types/quality';
	import type { QuarantineLot } from '$lib/types/nc';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher NC, lot en attente, lot en quarantaine…');
		return () => pageSearch.deactivate();
	});

	// La barre de recherche globale du header reste, en amont des filtres par colonne : elle alimente
	// chaque listing (son UX est vouée à disparaître, cf. plan).
	const openNc = $derived(
		filterRowsByText(data.openNc, pageSearch.query, (r) => [r.id, r.type, r.lot, r.statut])
	);
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

	let activeTab = $state<TabId>('pending');

	// Le compteur suit la liste filtree par la recherche globale : un onglet vide signale qu'il faut
	// aller voir ailleurs, sans quitter la page.
	const tabs = $derived([
		{ id: 'pending' as TabId, label: 'Lots en attente de contrôle', count: pendingQc.length },
		{ id: 'nc' as TabId, label: 'NC ouvertes', count: openNc.length },
		{ id: 'quarantine' as TabId, label: 'Lots en quarantaine', count: quarantineLots.length }
	]);

	// Modale d'action : une seule ouverte à la fois, ouverte depuis la colonne Actions des listings.
	type ActionState =
		| { mode: 'control'; lot: PendingQcLot }
		| { mode: 'release'; lot: QuarantineLot }
		| null;

	let action = $state<ActionState>(null);

	const modalTitle = $derived(
		action?.mode === 'control'
			? 'Saisir le contrôle qualité'
			: action?.mode === 'release'
				? 'Lever la quarantaine'
				: ''
	);

	// `use:enhance` : pas de rechargement. Succès → recharge les données (la ligne traitée disparaît)
	// et ferme la modale. Échec → modale ouverte, l'erreur s'affiche dedans SANS vider la saisie ni
	// recharger (l'utilisateur corrige et renvoie). Sans remontage, l'onglet actif est préservé (plus
	// besoin d'une logique `initialTab`).
	const onActionSubmit: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				action = null;
			} else {
				await update({ reset: false, invalidateAll: false });
			}
		};
	};
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
				<PendingQcListing
					rows={pendingQc}
					role={data.user.role}
					onsaisir={(lot) => (action = { mode: 'control', lot })}
				/>
			</Tabs.Content>

			<Tabs.Content value="nc">
				<NcOpenListing rows={openNc} />
			</Tabs.Content>

			<Tabs.Content value="quarantine">
				<QuarantineListing
					rows={quarantineLots}
					role={data.user.role}
					onlever={(lot) => (action = { mode: 'release', lot })}
					onexport={exportList}
				/>
			</Tabs.Content>
		</Tabs>
	</div>
{/if}

<Modal open={action !== null} title={modalTitle} onclose={() => (action = null)}>
	{#if action?.mode === 'control'}
		<form method="POST" action="?/control" use:enhance={onActionSubmit} class="modal-form">
			<input type="hidden" name="lotId" value={action.lot.id} />
			<p class="modal-lot">Lot {action.lot.lot} · {action.lot.produit}</p>

			{#if form?.controlError && form?.controlLotId === action.lot.id}
				<p class="modal-error" role="alert">❌ {form.controlError}</p>
			{/if}

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

			<div class="modal-actions">
				<button type="submit" name="resultat" value="CONFORME" class="conforme">
					Conforme — libérer le lot
				</button>
				<button type="submit" name="resultat" value="NON_CONFORME" class="non-conforme">
					Non conforme — mettre en quarantaine
				</button>
			</div>
		</form>
	{:else if action?.mode === 'release'}
		<form method="POST" action="?/release" use:enhance={onActionSubmit} class="modal-form">
			<input type="hidden" name="lotId" value={action.lot.id} />
			<p class="modal-lot">Lot {action.lot.numero} · {action.lot.detail}</p>

			{#if form?.releaseError && form?.lotId === action.lot.id}
				<p class="modal-error" role="alert">❌ {form.releaseError}</p>
			{/if}

			<label>
				<span>Motif de levée</span>
				<input
					type="text"
					name="motif"
					placeholder="Ex. : 2ᵉ contrôle conforme"
					required
					minlength="3"
				/>
			</label>

			<button type="submit" class="lever">Lever la quarantaine</button>
		</form>
	{/if}
</Modal>

<style>
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

	/* --- Onglets (Skeleton/Zag, habillés avec la charte --nc-*) --- */
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

	/* --- Formulaires en modale --- */
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-lot {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.modal-error {
		margin: 0;
		font-size: 0.8125rem;
		color: #991b1b;
	}

	.modal-form label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}

	.modal-form input {
		padding: 0.5rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.modal-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.modal-actions button,
	.lever {
		padding: 0.5rem 0.9rem;
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

	.lever {
		background: var(--nc-brand-dark);
	}

	.lever:hover {
		background: var(--nc-brand-hover);
	}
</style>

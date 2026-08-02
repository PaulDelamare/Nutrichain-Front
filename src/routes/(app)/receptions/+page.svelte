<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import ReceiptFilters from '$lib/components/receptions/ReceiptFilters.svelte';
	import { pageHref } from '$lib/utils/pageSearch/pageHref';
	import {
		receptionsPageSizeParams,
		receptionsSearchParams
	} from '$lib/utils/receptions/receptionsSearchParams';
	import { emptyReceiptFilters } from '$lib/types/receipt';
	import { peutEcrire } from '$lib/config/roles';
	import { UNIT_OPTIONS } from '$lib/utils/units';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const peutCreer = $derived(peutEcrire(data.user.role));

	const COLUMNS = ['Réf. expédition', 'Fournisseur', 'Contrôle', 'Date'];

	// --- Filtres pilotés par l'URL (requête filtrée côté API) ---
	// Les champs se réalignent sur l'URL après chaque navigation. Un $state (et non un $derived) car
	// le panneau mute des propriétés via bind:filters.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let filters = $state(emptyReceiptFilters());
	$effect(() => {
		filters = { ...data.filters };
	});

	const fournisseurOptions = $derived([
		{ label: 'Tous les fournisseurs', value: 'tous' },
		...data.suppliers.map((s) => ({ label: s.nom_ferme, value: s.id }))
	]);
	const statutOptions = [
		{ label: 'Tous les contrôles', value: 'tous' },
		{ label: 'OK', value: 'OK' },
		{ label: 'Alerte', value: 'ALERTE' },
		{ label: 'Non conforme', value: 'NONCONFORME' }
	];

	const hrefForPage = $derived((target: number) =>
		pageHref(resolve('/receptions'), $page.url.searchParams, target)
	);

	function navigate(params: URLSearchParams) {
		const qs = params.toString();
		if (qs === $page.url.searchParams.toString()) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/receptions')}${qs ? `?${qs}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function apply() {
		navigate(receptionsSearchParams($page.url.searchParams, filters));
	}

	function changePageSize(event: Event) {
		const size = Number((event.currentTarget as HTMLSelectElement).value);
		navigate(receptionsPageSizeParams($page.url.searchParams, size));
	}

	// --- Modale d'ajout ---
	let addOpen = $state(false);
	let envoi = $state(false);

	// use:enhance : succès → ferme la modale + rafraîchit (la nouvelle réception apparaît) ; échec →
	// modale ouverte, erreur affichée dedans, saisie conservée.
	const onCreate: SubmitFunction = () => {
		envoi = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				addOpen = false;
			} else {
				await update({ reset: false, invalidateAll: false });
			}
			envoi = false;
		};
	};
</script>

<PageHead
	heading="Réceptions terrain"
	description="Flux entrants — fournisseur, contrôle à réception, lots créés."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

{#if form?.created}
	<p class="feedback ok" role="status">
		Réception créée —
		<a href={resolve('/(app)/fiche-lot/[lotId]', { lotId: form.created.batchId })}>ouvrir le lot</a>
	</p>
{/if}

{#if !data.error}
	<div class="topbar">
		{#if peutCreer}
			<button type="button" class="add" onclick={() => (addOpen = true)}>
				Enregistrer une réception
			</button>
		{:else}
			<p class="hint">Réservé aux opérateurs, administrateurs et propriétaires.</p>
		{/if}
	</div>

	<ReceiptFilters bind:filters {fournisseurOptions} {statutOptions} onapply={apply} />

	<div class="toolbar">
		<label class="page-size">
			<span>Afficher</span>
			<select
				value={String(data.pageSize)}
				onchange={changePageSize}
				aria-label="Réceptions par page"
			>
				{#each data.pageSizeOptions as size (size)}
					<option value={String(size)}>{size} par page</option>
				{/each}
			</select>
		</label>
	</div>

	<div class="results">
		<DataTable
			columns={COLUMNS}
			rows={data.receipts}
			rowKey={(r) => r.id}
			empty="Aucune réception ne correspond aux filtres."
		>
			{#snippet row(r)}
				<td class="mono">{r.shipmentId}</td>
				<td>{r.fournisseur}</td>
				<td>{r.statut}</td>
				<td>{r.date}</td>
			{/snippet}
		</DataTable>
	</div>

	<Pagination
		page={data.pagination.page}
		totalPages={data.pagination.totalPages}
		total={data.pagination.total}
		unit="réceptions"
		hrefFor={hrefForPage}
	/>
{/if}

<Modal open={addOpen} title="Enregistrer une réception" onclose={() => (addOpen = false)}>
	<form method="POST" action="?/create" use:enhance={onCreate} class="modal-form">
		{#if form?.createError}
			<p class="err" role="alert">❌ {form.createError}</p>
		{/if}

		<label>
			<span>Fournisseur</span>
			<select name="id_fournisseur" required>
				<option value="">—</option>
				{#each data.suppliers as s (s.id)}
					<option value={s.id}>{s.nom_ferme}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Réf. BL / shipment</span>
			<input name="shipment_id" required minlength="3" maxlength="100" placeholder="BL-2026-0042" />
		</label>

		<label>
			<span>Produit</span>
			<select name="id_produit" required>
				<option value="">—</option>
				{#each data.products as p (p.id)}
					<option value={p.id}>{p.nom} ({p.code_gtin})</option>
				{/each}
			</select>
		</label>

		<div class="row">
			<label>
				<span>Quantité</span>
				<input name="quantite_actuelle" type="number" step="any" min="0.01" required />
			</label>
			<label>
				<span>Unité</span>
				<select name="unite_code" required>
					{#each UNIT_OPTIONS as u (u.code)}
						<option value={u.code}>{u.label}</option>
					{/each}
				</select>
			</label>
		</div>

		<label>
			<span>Contrôle à réception</span>
			<select name="statut_controle" required>
				<option value="OK">OK</option>
				<option value="ALERTE">Alerte</option>
				<option value="NONCONFORME">Non conforme</option>
			</select>
		</label>

		<label>
			<span>Matériel (optionnel)</span>
			<select name="id_materiel">
				<option value="">—</option>
				{#each data.equipment as e (e.id)}
					<option value={e.id}>{e.nom}</option>
				{/each}
			</select>
		</label>

		<div class="row">
			<label>
				<span>N° de lot (optionnel)</span>
				<input name="lot_number" maxlength="20" pattern={'[A-Za-z0-9._-]{1,20}'} />
			</label>
			<label>
				<span>DLC (optionnel)</span>
				<input name="date_peremption" type="date" />
			</label>
		</div>

		<button type="submit" class="submit" disabled={envoi}>Enregistrer</button>
	</form>
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

	.feedback a {
		color: var(--nc-brand);
		font-weight: 500;
	}

	/* Bouton d'action à gauche : rapproche l'appel à l'action du début de lecture de la page. */
	.topbar {
		display: flex;
		justify-content: flex-start;
		margin-bottom: 1rem;
	}

	.add {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.add:hover {
		background: var(--nc-brand-hover);
	}

	.hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}

	.toolbar {
		display: flex;
		justify-content: flex-end;
		margin: 1rem 0 0.75rem;
	}

	.page-size {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.page-size select {
		height: 2.25rem;
		padding: 0 0.6rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.875rem;
		color: var(--nc-text);
	}

	.page-size select:focus {
		outline: 2px solid var(--nc-brand-ring);
		outline-offset: 0;
		border-color: var(--nc-brand-border-focus);
	}

	.mono {
		font-variant-numeric: tabular-nums;
	}

	/* --- Formulaire en modale --- */
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-form .row {
		display: flex;
		gap: 0.75rem;
	}

	.modal-form .row label {
		flex: 1;
	}

	.modal-form label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--nc-text-muted);
	}

	.modal-form input,
	.modal-form select {
		padding: 0.5rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--nc-text);
	}

	.submit {
		margin-top: 0.25rem;
		padding: 0.55rem 0.9rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.submit:hover {
		background: var(--nc-brand-hover);
	}

	.err {
		margin: 0;
		font-size: 0.8125rem;
		color: #b91c1c;
	}
</style>

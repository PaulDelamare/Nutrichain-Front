<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onDestroy, tick } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import NcFilterBar from '$lib/components/nc/NcFilterBar.svelte';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';
	import { peutAdministrer, type KnownRole } from '$lib/config/roles';
	import { debounce } from '$lib/utils/debounce';
	import { pageHref } from '$lib/utils/pageSearch/pageHref';
	import {
		equipmentSearchParams,
		equipmentPageSizeParams
	} from '$lib/utils/config/equipmentSearchParams';
	import { emptyEquipmentFilters, type EquipmentFilters } from '$lib/types/equipment';
	import {
		COLD_EQUIPMENT_TYPES,
		EQUIPMENT_TYPE_OPTIONS,
		equipmentTypeLabel,
		type EquipmentType
	} from '$lib/config/equipment';
	import type { ApiEquipmentList, ApiLocation } from '$lib/Api/organization.server';

	type EquipmentForm = {
		equipmentError?: string;
		equipmentCreated?: unknown;
	} | null;

	type Props = {
		equipment: ApiEquipmentList;
		filters: EquipmentFilters;
		activeLocations: ApiLocation[];
		pageSize: number;
		pageSizeOptions: number[];
		form?: EquipmentForm;
		role: KnownRole;
	};

	let {
		equipment,
		filters: dataFilters,
		activeLocations,
		pageSize,
		pageSizeOptions,
		form = null,
		role
	}: Props = $props();

	const canManage = $derived(peutAdministrer(role));

	// --- Filtres pilotés par l'URL (requête filtrée côté API) ---
	// eslint-disable-next-line svelte/prefer-writable-derived
	let filters = $state(emptyEquipmentFilters());
	$effect(() => {
		filters = { ...dataFilters };
	});

	const hrefForPage = $derived((target: number) =>
		pageHref(resolve('/configuration'), $page.url.searchParams, target)
	);

	function navigate(params: URLSearchParams) {
		const qs = params.toString();
		if (qs === $page.url.searchParams.toString()) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/configuration')}${qs ? `?${qs}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	const applyDebounced = debounce(() => apply(), 500);
	onDestroy(() => applyDebounced.cancel());

	function apply() {
		navigate(equipmentSearchParams($page.url.searchParams, filters));
	}

	async function applyImmediately() {
		applyDebounced.cancel();
		await tick();
		apply();
	}

	function changePageSize(event: Event) {
		const size = Number((event.currentTarget as HTMLSelectElement).value);
		navigate(equipmentPageSizeParams($page.url.searchParams, size));
	}

	const columns = ['Nom', 'Type', 'Emplacement', 'Seuil °C', 'Statut', 'Étiquette'];

	// Le matériel ne s'édite ni ne s'archive côté API : la modale ne fait que de la création.
	let creating = $state(false);
	let envoi = $state(false);
	let typeMateriel = $state<EquipmentType>('FRIGO');
	const seuilRequis = $derived(COLD_EQUIPMENT_TYPES.includes(typeMateriel));

	function openCreate() {
		typeMateriel = 'FRIGO';
		creating = true;
	}

	const onSave: SubmitFunction = () => {
		envoi = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				creating = false;
			} else {
				await update({ reset: false, invalidateAll: false });
			}
			envoi = false;
		};
	};

	const seuilLabel = (v: string | number | null) => (v == null ? '—' : `${v} °C`);
</script>

<div class="topbar">
	{#if canManage}
		{#if activeLocations.length === 0}
			<p class="hint">Créez d'abord un emplacement actif pour pouvoir ajouter du matériel.</p>
		{:else}
			<button type="button" class="add" onclick={openCreate}>Ajouter un matériel</button>
		{/if}
	{/if}
</div>

<NcFilterBar onapply={apply}>
	<label class="field">
		<span>Nom</span>
		<input
			type="text"
			placeholder="Nom du matériel"
			bind:value={filters.nom}
			oninput={() => applyDebounced()}
		/>
	</label>
	<label class="field">
		<span>Type</span>
		<select bind:value={filters.type} onchange={applyImmediately}>
			<option value="tous">Tous les types</option>
			{#each EQUIPMENT_TYPE_OPTIONS as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</label>
</NcFilterBar>

<div class="toolbar">
	<label class="page-size">
		<span>Afficher</span>
		<select value={String(pageSize)} onchange={changePageSize} aria-label="Matériel par page">
			{#each pageSizeOptions as size (size)}
				<option value={String(size)}>{size} par page</option>
			{/each}
		</select>
	</label>
</div>

<div class="results">
	<DataTable
		{columns}
		rows={equipment.data}
		rowKey={(m) => m.id}
		empty="Aucun matériel ne correspond aux filtres."
	>
		{#snippet row(m)}
			<td class="nom">{m.nom}</td>
			<td>{equipmentTypeLabel(m.type)}</td>
			<td>{m.lieu?.nom ?? '—'}</td>
			<td>{seuilLabel(m.temp_seuil_max)}</td>
			<td>{m.statut}</td>
			<td>
				<a
					class="label-link"
					href={resolve('/(app)/configuration/equipment/[id]/label', {
						id: encodeURIComponent(m.id)
					})}
					target="_blank"
					rel="noopener"
				>
					Étiquette QR
				</a>
			</td>
		{/snippet}
	</DataTable>
</div>

<Pagination
	page={equipment.pagination.page}
	totalPages={equipment.pagination.totalPages}
	total={equipment.pagination.total}
	unit="matériels"
	hrefFor={hrefForPage}
/>

{#if !canManage && equipment.pagination.total > 0}
	<ActionReservee action="La gestion du matériel" {role} />
{/if}

<Modal open={creating} title="Ajouter un matériel" onclose={() => (creating = false)}>
	<form method="POST" action="?/createEquipment" use:enhance={onSave} class="modal-form">
		{#if form?.equipmentError}
			<p class="err" role="alert">❌ {form.equipmentError}</p>
		{/if}

		<label>
			<span>Nom</span>
			<input name="nom" required minlength="3" maxlength="100" placeholder="Ex. : Frigo réception A" />
		</label>

		<label>
			<span>Type</span>
			<select name="type" bind:value={typeMateriel}>
				{#each EQUIPMENT_TYPE_OPTIONS as opt (opt.value)}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Emplacement</span>
			<select name="id_lieu" required>
				{#each activeLocations as lieu (lieu.id)}
					<option value={lieu.id}>{lieu.nom}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>{seuilRequis ? 'Seuil max °C (requis)' : 'Seuil max °C (facultatif)'}</span>
			<input name="temp_seuil_max" type="number" step="0.1" required={seuilRequis} />
		</label>

		<label>
			<span>ID capteur IoT (facultatif)</span>
			<input name="sensor_id" maxlength="100" />
		</label>

		<button type="submit" class="submit" disabled={envoi}>Ajouter</button>
	</form>
</Modal>

<style>
	/* Bouton d'action à gauche : rapproche l'appel à l'action du début de lecture de la page. */
	.topbar {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		min-height: 2.25rem;
		margin-bottom: 1rem;
	}

	.hint {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
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

	.results {
		margin-top: 0.25rem;
	}

	.nom {
		font-weight: 600;
		color: var(--nc-text);
	}

	.label-link {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--nc-brand);
		white-space: nowrap;
	}

	.label-link:hover {
		text-decoration: underline;
	}

	/* --- Formulaire en modale --- */
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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
		background: #fff;
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

	.submit:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.err {
		margin: 0;
		font-size: 0.8125rem;
		color: #b91c1c;
	}
</style>

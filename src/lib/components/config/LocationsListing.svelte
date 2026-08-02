<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import NcFilterBar from '$lib/components/nc/NcFilterBar.svelte';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';
	import { peutAdministrer, type KnownRole } from '$lib/config/roles';
	import { debounce } from '$lib/utils/debounce';
	import { emptyLocationFilters } from '$lib/types/location';
	import { filterLocations } from '$lib/utils/config/filterLocations';
	import { formatCoordinates } from '$lib/utils/geo/coordinates';
	import type { ApiLocation } from '$lib/Api/organization.server';

	type LocationForm = {
		locationError?: string;
		locationCreated?: unknown;
		locationUpdated?: unknown;
	} | null;

	type Props = {
		locations: ApiLocation[];
		form?: LocationForm;
		role: KnownRole;
	};

	let { locations, form = null, role }: Props = $props();

	const canManage = $derived(peutAdministrer(role));

	const PAGE_SIZE = 10;

	// Datalist : quelques types standard + ceux déjà utilisés par l'organisation. `type` reste libre.
	const STANDARD_TYPES = [
		'Réception',
		'Chambre froide',
		'Production',
		'Zone de stockage',
		'Expédition'
	];
	const usedTypes = $derived(
		Array.from(new Set(locations.map((l) => l.type).filter((t): t is string => !!t))).sort()
	);
	const typeSuggestions = $derived(Array.from(new Set([...STANDARD_TYPES, ...usedTypes])).sort());
	const typeFilterOptions = $derived([
		{ label: 'Tous les types', value: 'tous' },
		...usedTypes.map((t) => ({ label: t, value: t }))
	]);

	// Filtres + pagination CLIENT (référentiel borné).
	let draft = $state(emptyLocationFilters());
	let applied = $state(emptyLocationFilters());
	let pageN = $state(1);

	const filtered = $derived(filterLocations(locations, applied));
	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
	const currentPage = $derived(Math.min(pageN, totalPages));
	const pageRows = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

	const applyDebounced = debounce(() => apply(), 500);
	onDestroy(() => applyDebounced.cancel());

	function apply() {
		applied = { ...draft };
		pageN = 1;
	}

	async function applyImmediately() {
		applyDebounced.cancel();
		await tick();
		apply();
	}

	const columns = $derived(
		canManage
			? ['Nom', 'Type', 'Position', 'Statut', 'Actions']
			: ['Nom', 'Type', 'Position', 'Statut']
	);

	// Modale partagée create / edit.
	type Editing = { mode: 'create' } | { mode: 'edit'; location: ApiLocation } | null;
	let editing = $state<Editing>(null);
	let envoi = $state(false);

	const modalTitle = $derived(
		editing?.mode === 'edit' ? "Modifier l'emplacement" : 'Ajouter un emplacement'
	);

	// use:enhance : succès → ferme la modale + rafraîchit ; échec → reste ouverte, erreur affichée,
	// saisie conservée. Sert aussi au toggle (le `editing = null` y est un no-op).
	const onSave: SubmitFunction = () => {
		envoi = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				editing = null;
			} else {
				await update({ reset: false, invalidateAll: false });
			}
			envoi = false;
		};
	};

	const coordValue = (v: string | number | null | undefined) =>
		v == null || v === '' ? '' : String(v);
</script>

<div class="topbar">
	{#if canManage}
		<button type="button" class="add" onclick={() => (editing = { mode: 'create' })}>
			Ajouter un emplacement
		</button>
	{/if}
</div>

<NcFilterBar onapply={apply}>
	<label class="field">
		<span>Nom</span>
		<input
			type="text"
			placeholder="Nom de l'emplacement"
			bind:value={draft.nom}
			oninput={() => applyDebounced()}
		/>
	</label>
	<label class="field">
		<span>Type</span>
		<select bind:value={draft.type} onchange={applyImmediately}>
			{#each typeFilterOptions as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</label>
	<label class="field">
		<span>Statut</span>
		<select bind:value={draft.statut} onchange={applyImmediately}>
			<option value="tous">Tous les statuts</option>
			<option value="actif">Actif</option>
			<option value="archive">Archivé</option>
		</select>
	</label>
</NcFilterBar>

<div class="results">
	<DataTable
		{columns}
		rows={pageRows}
		rowKey={(l) => l.id}
		empty="Aucun emplacement ne correspond aux filtres."
	>
		{#snippet row(l)}
			<td class="nom">{l.nom}</td>
			<td>{l.type ?? '—'}</td>
			<td>{formatCoordinates(l.latitude, l.longitude) ?? 'sans position'}</td>
			<td>{l.is_active ? 'Actif' : 'Archivé'}</td>
			{#if canManage}
				<td class="actions">
					<button
						type="button"
						class="link-btn"
						onclick={() => (editing = { mode: 'edit', location: l })}
					>
						Éditer
					</button>
					<form method="POST" action="?/toggleLocation" use:enhance={onSave} class="inline">
						<input type="hidden" name="id" value={l.id} />
						<input type="hidden" name="active" value={String(!l.is_active)} />
						<button type="submit" class="link-btn">{l.is_active ? 'Archiver' : 'Réactiver'}</button>
					</form>
				</td>
			{/if}
		{/snippet}
	</DataTable>
</div>

<Pagination
	page={currentPage}
	{totalPages}
	total={filtered.length}
	unit="emplacements"
	onselect={(p) => (pageN = p)}
/>

{#if !canManage && locations.length > 0}
	<ActionReservee action="La gestion des emplacements" {role} />
{/if}

<Modal open={editing !== null} title={modalTitle} onclose={() => (editing = null)}>
	{#if editing}
		<form
			method="POST"
			action={editing.mode === 'edit' ? '?/updateLocation' : '?/createLocation'}
			use:enhance={onSave}
			class="modal-form"
		>
			{#if form?.locationError}
				<p class="err" role="alert">❌ {form.locationError}</p>
			{/if}
			{#if editing.mode === 'edit'}
				<input type="hidden" name="id" value={editing.location.id} />
			{/if}

			<label>
				<span>Nom</span>
				<input
					name="nom"
					required
					minlength="2"
					maxlength="120"
					value={editing.mode === 'edit' ? editing.location.nom : ''}
				/>
			</label>

			<label>
				<span>Type (facultatif)</span>
				<input
					name="type"
					list="location-types"
					maxlength="60"
					placeholder="Ex. : Chambre froide"
					value={editing.mode === 'edit' ? (editing.location.type ?? '') : ''}
				/>
				<datalist id="location-types">
					{#each typeSuggestions as t (t)}
						<option value={t}></option>
					{/each}
				</datalist>
			</label>

			<label>
				<span>Description (facultatif)</span>
				<input
					name="description"
					maxlength="300"
					value={editing.mode === 'edit' ? (editing.location.description ?? '') : ''}
				/>
			</label>

			<p class="hint">
				Position sur la carte (facultatif) — c'est la seule source du repère de la fiche lot.
				Laissez les deux champs vides pour la retirer.
			</p>
			<div class="row">
				<label>
					<span>Latitude</span>
					<input
						name="latitude"
						type="number"
						step="0.000001"
						min="-90"
						max="90"
						placeholder="48.832910"
						value={editing.mode === 'edit' ? coordValue(editing.location.latitude) : ''}
					/>
				</label>
				<label>
					<span>Longitude</span>
					<input
						name="longitude"
						type="number"
						step="0.000001"
						min="-180"
						max="180"
						placeholder="2.286540"
						value={editing.mode === 'edit' ? coordValue(editing.location.longitude) : ''}
					/>
				</label>
			</div>

			<button type="submit" class="submit" disabled={envoi}>
				{editing.mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
			</button>
		</form>
	{/if}
</Modal>

<style>
	.topbar {
		display: flex;
		justify-content: flex-end;
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

	.results {
		margin-top: 1rem;
	}

	.nom {
		font-weight: 600;
		color: var(--nc-text);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.inline {
		display: inline;
	}

	.link-btn {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--nc-brand);
		cursor: pointer;
	}

	.link-btn:hover {
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

	.modal-form .row {
		display: flex;
		gap: 0.75rem;
	}

	.modal-form .row label {
		flex: 1;
	}

	.modal-form input {
		padding: 0.5rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--nc-text);
	}

	.hint {
		margin: 0.25rem 0 0;
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--nc-text-subtle);
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

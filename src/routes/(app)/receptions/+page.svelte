<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Placeholder from '$lib/components/page/Placeholder.svelte';
	import { peutEcrire } from '$lib/config/roles';
	import { UNIT_OPTIONS } from '$lib/utils/units';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const peutCreer = $derived(peutEcrire(data.user.role));
</script>

<PageHead
	heading="Réceptions terrain"
	description="Flux entrants — fournisseur, contrôle à réception, lots créés."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

<section class="create">
	<h2>Enregistrer une réception</h2>
	{#if peutCreer}
		<form method="POST" action="?/create" class="form">
			<label>
				Fournisseur
				<select name="id_fournisseur" required>
					<option value="">—</option>
					{#each data.suppliers as s (s.id)}
						<option value={s.id}>{s.nom_ferme}</option>
					{/each}
				</select>
			</label>
			<label>
				Réf. BL / shipment
				<input
					name="shipment_id"
					required
					minlength="3"
					maxlength="100"
					placeholder="BL-2026-0042"
				/>
			</label>
			<label>
				Produit
				<select name="id_produit" required>
					<option value="">—</option>
					{#each data.products as p (p.id)}
						<option value={p.id}>{p.nom} ({p.code_gtin})</option>
					{/each}
				</select>
			</label>
			<label>
				Quantité
				<input name="quantite_actuelle" type="number" step="any" min="0.01" required />
			</label>
			<label>
				Unité
				<select name="unite_code" required>
					{#each UNIT_OPTIONS as u (u.code)}
						<option value={u.code}>{u.label}</option>
					{/each}
				</select>
			</label>
			<label>
				Contrôle à réception
				<select name="statut_controle" required>
					<option value="OK">OK</option>
					<option value="ALERTE">Alerte</option>
					<option value="NONCONFORME">Non conforme</option>
				</select>
			</label>
			<label>
				Matériel (optionnel)
				<select name="id_materiel">
					<option value="">—</option>
					{#each data.equipment as e (e.id)}
						<option value={e.id}>{e.nom}</option>
					{/each}
				</select>
			</label>
			<label>
				N° de lot (optionnel)
				<input name="lot_number" maxlength="20" pattern={'[A-Za-z0-9._-]{1,20}'} />
			</label>
			<label>
				DLC (optionnel)
				<input name="date_peremption" type="date" />
			</label>
			<button type="submit">Enregistrer</button>
		</form>
		{#if form?.created}
			<p class="ok" role="status">
				Réception créée —
				<a href={resolve('/(app)/fiche-lot/[lotId]', { lotId: form.created.batchId })}>
					ouvrir le lot
				</a>
			</p>
		{:else if form?.createError}
			<p class="err" role="status">{form.createError}</p>
		{/if}
	{:else}
		<p class="hint">Réservé aux opérateurs, administrateurs et propriétaires.</p>
	{/if}
</section>

{#if data.receipts.length > 0}
	<p class="count">
		{data.total} réception{data.total > 1 ? 's' : ''} enregistrée{data.total > 1 ? 's' : ''}
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Réf. expédition</th>
					<th>Fournisseur</th>
					<th>Contrôle</th>
					<th>Date</th>
				</tr>
			</thead>
			<tbody>
				{#each data.receipts as row (row.id)}
					<tr>
						<td class="mono">{row.shipmentId}</td>
						<td>{row.fournisseur}</td>
						<td>{row.statut}</td>
						<td>{row.date}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else if !data.error}
	<Placeholder message="Aucune réception enregistrée pour le moment." />
{/if}

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

	.create {
		margin: 0 0 1.5rem;
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.create h2 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
	}

	.form {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
		gap: 0.75rem;
		align-items: end;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--nc-text-muted);
	}

	input,
	select,
	button {
		padding: 0.45rem 0.55rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--nc-text);
	}

	button {
		border: none;
		background: var(--nc-brand-dark);
		color: #fff;
		font-weight: 500;
		cursor: pointer;
	}

	.ok {
		margin: 0.75rem 0 0;
		color: #166534;
		font-size: 0.875rem;
	}

	.err {
		margin: 0.75rem 0 0;
		color: #b91c1c;
		font-size: 0.875rem;
	}

	.hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}

	.count {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.table-wrap {
		overflow-x: auto;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th,
	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f1f5f9;
		text-align: left;
	}

	th {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--nc-text-muted);
		background: #f8fafc;
	}

	.mono {
		font-variant-numeric: tabular-nums;
	}
</style>

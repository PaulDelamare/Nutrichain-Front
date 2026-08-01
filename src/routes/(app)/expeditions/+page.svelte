<script lang="ts">
	import PageHead from '$lib/components/page/PageHead.svelte';
	import Placeholder from '$lib/components/page/Placeholder.svelte';
	import { peutEcrire } from '$lib/config/roles';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const canWrite = $derived(peutEcrire(data.user.role));

	/**
	 * Geste irréversible : la date d'arrivée est scellée dans le journal WORM et aucune route ne
	 * l'annule. Les boutons sont identiques d'une ligne à l'autre — sans ce garde-fou, un clic une
	 * ligne trop bas date définitivement la mauvaise expédition.
	 */
	function confirmDelivery(ref: string, event: SubmitEvent) {
		if (!confirm(`Constater l'arrivée de l'expédition ${ref} ? La date sera définitive.`)) {
			event.preventDefault();
		}
	}
</script>

<PageHead
	heading="Expéditions"
	description="Flux sortants — destination, statut de livraison, lots embarqués."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

<section class="create">
	<h2>Créer une expédition</h2>
	{#if canWrite}
		<form method="POST" action="?/create" class="form">
			<label>
				Client
				<select name="id_client" required>
					<option value="">—</option>
					{#each data.customers as c (c.id)}
						<option value={c.id}>{c.nom_enseigne}</option>
					{/each}
				</select>
			</label>
			<label>
				Référence (AUTO = SSCC serveur)
				<input name="shipment_id" maxlength="100" placeholder="AUTO" value="AUTO" />
			</label>
			<label>
				Transporteur
				<input name="transporteur" required minlength="2" maxlength="100" />
			</label>
			<label class="wide">
				Adresse de destination
				<input
					name="destination_adresse"
					required
					minlength="5"
					maxlength="255"
					placeholder="Adresse de livraison"
				/>
			</label>
			<label class="wide">
				Lot à expédier
				<select name="id_lot" required>
					<option value="">—</option>
					{#each data.lots as lot (lot.id)}
						<option value={lot.id}>{lot.label}</option>
					{/each}
				</select>
			</label>
			<label>
				Quantité
				<input name="quantite_expediee" type="number" step="any" min="0.01" required />
			</label>
			<button type="submit">Expédier</button>
		</form>
		{#if form?.created}
			<p class="ok" role="status">Expédition créée — réf. {form.created.shipment_id}</p>
		{:else if form?.createError}
			<p class="err" role="status">{form.createError}</p>
		{/if}
	{:else}
		<p class="hint">Réservé aux opérateurs, administrateurs et propriétaires.</p>
	{/if}
</section>

{#if form?.confirmed}
	<p class="ok" role="status">
		Livraison confirmée — réf. {form.confirmed.ref}, arrivée le {form.confirmed.date}
	</p>
{:else if form?.confirmError}
	<p class="err" role="status">{form.confirmError}</p>
{/if}

{#if data.shipments.length > 0}
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Référence</th>
					<th>Client</th>
					<th>Statut</th>
					<th>Date envoi</th>
					<th>Arrivée</th>
					<th>Lots</th>
					{#if canWrite}<th>Action</th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each data.shipments as row (row.id)}
					<tr>
						<td class="mono">{row.ref}</td>
						<td>{row.client}</td>
						<td>{row.statut}</td>
						<td>{row.date}</td>
						<!-- Une arrivée non constatée se dit, elle ne se devine pas : c'est cette absence
						     qui prévient le décideur qu'il ignore où est la marchandise. -->
						<td>{row.deliveredAt ?? 'non constatée'}</td>
						<td>{row.lots}</td>
						{#if canWrite}
							<td>
								{#if !row.deliveredAt}
									<form
										method="POST"
										action="?/confirm"
										onsubmit={(e) => confirmDelivery(row.ref, e)}
									>
										<input type="hidden" name="id" value={row.id} />
										<button type="submit" class="confirm-delivery">Confirmer la livraison</button>
									</form>
								{:else}
									<span class="hint">—</span>
								{/if}
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else if !data.error}
	<Placeholder message="Aucune expédition enregistrée pour le moment." />
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

	.wide {
		grid-column: 1 / -1;
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

	.confirm-delivery {
		padding: 0.3rem 0.55rem;
		font-size: 0.8125rem;
		white-space: nowrap;
	}

	.hint {
		margin: 0;
		font-size: 0.875rem;
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

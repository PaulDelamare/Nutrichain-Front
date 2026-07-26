<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { peutEcrire } from '$lib/config/roles';
	import { UNIT_OPTIONS } from '$lib/utils/units';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const peutCreer = $derived(peutEcrire(data.user.role));
</script>

<PageHead
	heading="Transformations"
	description="Production — consommer des lots parents pour créer un lot enfant tracé."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

<section class="create">
	<h2>Enregistrer une transformation</h2>
	{#if peutCreer}
		<form method="POST" action="?/create" class="form">
			<label>
				Produit fini
				<select name="id_produit_fini" required>
					<option value="">—</option>
					{#each data.products as p (p.id)}
						<option value={p.id}>{p.nom}</option>
					{/each}
				</select>
			</label>
			<label>
				Matériel / cuve
				<select name="id_materiel" required>
					<option value="">—</option>
					{#each data.equipment as e (e.id)}
						<option value={e.id}>{e.nom}</option>
					{/each}
				</select>
			</label>
			<label>
				Quantité produite
				<input name="quantite_produite" type="number" step="0.01" min="0.01" required />
			</label>
			<label>
				Unité produite
				<select name="unite_code" required>
					{#each UNIT_OPTIONS as u (u.code)}
						<option value={u.code}>{u.label}</option>
					{/each}
				</select>
			</label>
			<label class="wide">
				Lot parent consommé
				<select name="id_lot_parent" required>
					<option value="">—</option>
					{#each data.lots as lot (lot.id)}
						<option value={lot.id}>{lot.label}</option>
					{/each}
				</select>
			</label>
			<label>
				Quantité prélevée
				<input name="quantite_prelevee" type="number" step="0.01" min="0.01" required />
			</label>
			<label>
				Unité prélevée
				<select name="unite_input" required>
					{#each UNIT_OPTIONS as u (u.code)}
						<option value={u.code}>{u.label}</option>
					{/each}
				</select>
			</label>
			<label>
				DLC (optionnel)
				<input name="date_peremption" type="date" />
			</label>
			<button type="submit">Produire</button>
		</form>
		{#if form?.created}
			<p class="ok" role="status">
				Transformation créée —
				<a
					href={resolve('/(app)/fiche-lot/[lotId]', {
						lotId: form.created.lot_enfant_id
					})}
				>
					ouvrir le lot enfant
				</a>
			</p>
		{:else if form?.createError}
			<p class="err" role="status">{form.createError}</p>
		{/if}
	{:else}
		<p class="hint">Réservé aux opérateurs, administrateurs et propriétaires.</p>
	{/if}
</section>

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

	.hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}
</style>

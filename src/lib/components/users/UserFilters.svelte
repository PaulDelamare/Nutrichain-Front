<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { debounce } from '$lib/utils/debounce';
	import type { UserFilters } from '$lib/types/user';

	type Option = { label: string; value: string };

	type Props = {
		filters: UserFilters;
		roleOptions?: Option[];
		onapply?: () => void;
	};

	let {
		filters = $bindable(),
		roleOptions = [{ label: 'Tous les rôles', value: 'tous' }],
		onapply
	}: Props = $props();

	// Saisie texte : on regroupe les frappes rapprochées en une seule recherche (0,5 s). Le seuil de
	// 3 caractères est appliqué par l'appelant avant la requête.
	const applyDebounced = debounce(() => onapply?.(), 500);
	onDestroy(() => applyDebounced.cancel());

	// Select : pas de frappe à attendre, on applique aussitôt. `tick()` garantit que `bind:value` a
	// écrit la nouvelle valeur avant qu'on lise le brouillon.
	async function applyImmediately() {
		applyDebounced.cancel();
		await tick();
		onapply?.();
	}
</script>

<form
	class="filters"
	onsubmit={(e) => {
		e.preventDefault();
		onapply?.();
	}}
>
	<label class="field">
		<span>E-mail</span>
		<input
			type="text"
			placeholder="Adresse e-mail"
			bind:value={filters.email}
			oninput={() => applyDebounced()}
		/>
	</label>

	<label class="field">
		<span>Rôle</span>
		<select bind:value={filters.role} onchange={applyImmediately}>
			{#each roleOptions as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</label>

	<label class="field">
		<span>MFA</span>
		<select bind:value={filters.mfa} onchange={applyImmediately}>
			<option value="tous">Tous</option>
			<option value="actif">Activée</option>
			<option value="inactif">Désactivée</option>
		</select>
	</label>

	<button type="submit" class="apply">Appliquer</button>
</form>

<style>
	.filters {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
		gap: 0.75rem 1rem;
		align-items: end;
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.field span {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--nc-text-muted);
	}

	.field input,
	.field select {
		box-sizing: border-box;
		width: 100%;
		height: 2.25rem;
		padding: 0 0.625rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.875rem;
		color: var(--nc-text);
	}

	.field input:focus,
	.field select:focus {
		outline: 2px solid var(--nc-brand-ring);
		outline-offset: 0;
		border-color: var(--nc-brand-border-focus);
	}

	.apply {
		height: 2.25rem;
		padding: 0 1.25rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}

	.apply:hover {
		background: var(--nc-brand-hover);
	}

	@media (max-width: 1100px) {
		.filters {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.apply {
			grid-column: 1 / -1;
			justify-self: start;
		}
	}

	@media (max-width: 520px) {
		.filters {
			grid-template-columns: 1fr;
		}
	}
</style>

<script lang="ts">
	import { lotStatutOptions } from '$lib/data/lot-search';
	import type { LotFilters } from '$lib/types/lot';

	type Option = { label: string; value: string };

	type Props = {
		filters: LotFilters;
		// Options dérivées des lots réellement chargés (dynamique).
		produitOptions?: Option[];
		siteOptions?: Option[];
		onapply?: () => void;
	};

	let {
		filters = $bindable(),
		produitOptions = [{ label: 'Tous les produits', value: 'tous' }],
		siteOptions = [{ label: 'Tous les sites', value: 'tous' }],
		onapply
	}: Props = $props();
</script>

<form
	class="filters"
	onsubmit={(e) => {
		e.preventDefault();
		onapply?.();
	}}
>
	<label class="field">
		<span>GTIN</span>
		<input type="text" placeholder="356007…" bind:value={filters.gtin} />
	</label>

	<label class="field">
		<span>N° lot</span>
		<input type="text" placeholder="L-2025-08912" bind:value={filters.lot} />
	</label>

	<label class="field">
		<span>Produit</span>
		<select bind:value={filters.produit}>
			{#each produitOptions as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</label>

	<label class="field">
		<span>Site</span>
		<select bind:value={filters.site}>
			{#each siteOptions as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</label>

	<label class="field">
		<span>Statut</span>
		<select bind:value={filters.statut}>
			{#each lotStatutOptions as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</label>

	<button type="submit" class="apply">Appliquer</button>
</form>

<style>
	.filters {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(0, 1fr) auto;
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

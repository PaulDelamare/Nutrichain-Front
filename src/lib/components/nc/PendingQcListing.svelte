<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';
	import NcFilterBar from './NcFilterBar.svelte';
	import PendingQcTable from './PendingQcTable.svelte';
	import { peutDeciderQualite, type KnownRole } from '$lib/config/roles';
	import { debounce } from '$lib/utils/debounce';
	import { emptyPendingQcFilters } from '$lib/types/ncFilters';
	import { filterPendingQc } from '$lib/utils/nc/filterNcLists';
	import type { PendingQcLot } from '$lib/types/quality';

	const PAGE_SIZE = 10;

	type Props = {
		rows: PendingQcLot[];
		role: KnownRole;
		onsaisir?: (lot: PendingQcLot) => void;
	};

	let { rows, role, onsaisir }: Props = $props();

	const canAct = $derived(peutDeciderQualite(role));

	// `draft` = saisie en cours ; `applied` = filtre effectif. La recherche texte attend 0,5 s (le
	// seuil de 3 caractères est porté par filterPendingQc), le select s'applique aussitôt.
	let draft = $state(emptyPendingQcFilters());
	let applied = $state(emptyPendingQcFilters());
	let pageN = $state(1);

	const produitOptions = $derived([
		{ label: 'Tous les produits', value: 'tous' },
		...Array.from(new Set(rows.map((r) => r.produit)))
			.sort()
			.map((p) => ({ label: p, value: p }))
	]);

	const filtered = $derived(filterPendingQc(rows, applied));
	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
	// La page courante est bornée par dérivation : après un filtre ou un rafraîchissement des données,
	// une page devenue hors limites retombe sur la dernière sans écrire dans l'état.
	const currentPage = $derived(Math.min(pageN, totalPages));
	const pageRows = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

	const applyDebounced = debounce(() => apply(), 500);
	onDestroy(() => applyDebounced.cancel());

	function apply() {
		applied = { ...draft };
		pageN = 1;
	}

	// `tick()` garantit que `bind:value` a écrit la nouvelle valeur du select avant de lire `draft`.
	async function applyImmediately() {
		applyDebounced.cancel();
		await tick();
		apply();
	}
</script>

<NcFilterBar onapply={apply}>
	<label class="field">
		<span>Lot</span>
		<input
			type="text"
			placeholder="Numéro de lot"
			bind:value={draft.lot}
			oninput={() => applyDebounced()}
		/>
	</label>
	<label class="field">
		<span>Produit</span>
		<select bind:value={draft.produit} onchange={applyImmediately}>
			{#each produitOptions as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</label>
	<label class="field">
		<span>Quantité</span>
		<input
			type="text"
			placeholder="ex. 300 L"
			bind:value={draft.quantite}
			oninput={() => applyDebounced()}
		/>
	</label>
	<label class="field">
		<span>Depuis</span>
		<input
			type="text"
			placeholder="ex. 2 jours"
			bind:value={draft.depuis}
			oninput={() => applyDebounced()}
		/>
	</label>
</NcFilterBar>

<div class="results">
	<PendingQcTable rows={pageRows} {canAct} {onsaisir} />
</div>

<Pagination
	page={currentPage}
	{totalPages}
	total={filtered.length}
	unit="lots"
	onselect={(p) => (pageN = p)}
/>

{#if !canAct && rows.length > 0}
	<ActionReservee action="La saisie d'un contrôle qualité" {role} />
{/if}

<style>
	.results {
		margin-top: 1rem;
	}
</style>

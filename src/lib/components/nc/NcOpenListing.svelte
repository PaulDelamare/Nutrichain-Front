<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import NcFilterBar from './NcFilterBar.svelte';
	import NcTable from './NcTable.svelte';
	import { debounce } from '$lib/utils/debounce';
	import { emptyNcOpenFilters } from '$lib/types/ncFilters';
	import { filterOpenNc } from '$lib/utils/nc/filterNcLists';
	import { ncStatusLabel } from '$lib/utils/nc/statusLabel';
	import type { NcRow, NcStatus } from '$lib/types/nc';

	const PAGE_SIZE = 10;
	const NC_STATUSES: NcStatus[] = ['en_cours', 'quarantaine'];

	type Props = { rows: NcRow[] };

	let { rows }: Props = $props();

	let draft = $state(emptyNcOpenFilters());
	let applied = $state(emptyNcOpenFilters());
	let pageN = $state(1);

	const typeOptions = $derived([
		{ label: 'Tous les types', value: 'tous' },
		...Array.from(new Set(rows.map((r) => r.type)))
			.sort()
			.map((t) => ({ label: t, value: t }))
	]);

	const filtered = $derived(filterOpenNc(rows, applied));
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
</script>

<NcFilterBar onapply={apply}>
	<label class="field">
		<span>ID</span>
		<input
			type="text"
			placeholder="Identifiant NC"
			bind:value={draft.id}
			oninput={() => applyDebounced()}
		/>
	</label>
	<label class="field">
		<span>Type</span>
		<select bind:value={draft.type} onchange={applyImmediately}>
			{#each typeOptions as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</label>
	<label class="field">
		<span>Lot</span>
		<input
			type="text"
			placeholder="Produit ou lot"
			bind:value={draft.lot}
			oninput={() => applyDebounced()}
		/>
	</label>
	<label class="field">
		<span>Statut</span>
		<select bind:value={draft.statut} onchange={applyImmediately}>
			<option value="tous">Tous les statuts</option>
			{#each NC_STATUSES as statut (statut)}
				<option value={statut}>{ncStatusLabel(statut)}</option>
			{/each}
		</select>
	</label>
</NcFilterBar>

<div class="results">
	<NcTable rows={pageRows} />
</div>

<Pagination
	page={currentPage}
	{totalPages}
	total={filtered.length}
	unit="non-conformités"
	onselect={(p) => (pageN = p)}
/>

<style>
	.results {
		margin-top: 1rem;
	}
</style>

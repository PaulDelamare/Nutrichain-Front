<script lang="ts">
	import { onDestroy } from 'svelte';
	import Pagination from '$lib/components/page/Pagination.svelte';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';
	import NcFilterBar from './NcFilterBar.svelte';
	import QuarantineTable from './QuarantineTable.svelte';
	import { peutDeciderQualite, type KnownRole } from '$lib/config/roles';
	import { debounce } from '$lib/utils/debounce';
	import { emptyQuarantineFilters } from '$lib/types/ncFilters';
	import { filterQuarantine } from '$lib/utils/nc/filterNcLists';
	import type { QuarantineLot } from '$lib/types/nc';

	const PAGE_SIZE = 10;

	type Props = {
		rows: QuarantineLot[];
		role: KnownRole;
		onlever?: (lot: QuarantineLot) => void;
		onexport?: () => void;
	};

	let { rows, role, onlever, onexport }: Props = $props();

	const canAct = $derived(peutDeciderQualite(role));

	let draft = $state(emptyQuarantineFilters());
	let applied = $state(emptyQuarantineFilters());
	let pageN = $state(1);

	const filtered = $derived(filterQuarantine(rows, applied));
	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
	const currentPage = $derived(Math.min(pageN, totalPages));
	const pageRows = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

	const applyDebounced = debounce(() => apply(), 500);
	onDestroy(() => applyDebounced.cancel());

	function apply() {
		applied = { ...draft };
		pageN = 1;
	}
</script>

<NcFilterBar onapply={apply}>
	<label class="field">
		<span>Numéro</span>
		<input
			type="text"
			placeholder="Numéro de lot"
			bind:value={draft.numero}
			oninput={() => applyDebounced()}
		/>
	</label>
	<label class="field">
		<span>Détail</span>
		<input
			type="text"
			placeholder="Produit ou statut"
			bind:value={draft.detail}
			oninput={() => applyDebounced()}
		/>
	</label>
</NcFilterBar>

<div class="results">
	<QuarantineTable rows={pageRows} {canAct} {onlever} />
</div>

<Pagination
	page={currentPage}
	{totalPages}
	total={filtered.length}
	unit="lots"
	onselect={(p) => (pageN = p)}
/>

{#if !canAct && rows.length > 0}
	<ActionReservee action="La levée de quarantaine" {role} />
{/if}

<button type="button" class="export" onclick={onexport}>Exporter la liste</button>

<style>
	.results {
		margin-top: 1rem;
	}

	.export {
		margin-top: 1.25rem;
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
		cursor: pointer;
	}

	.export:hover {
		background: #f8fafc;
	}
</style>

<script lang="ts">
	import NcTable from './NcTable.svelte';
	import type { NcRow } from '$lib/types/nc';

	type Props = {
		rows: NcRow[];
	};

	let { rows }: Props = $props();
</script>

<section class="panel">
	<h3>NC ouvertes</h3>
	<NcTable {rows} />
</section>

<style>
	.panel {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.panel h3 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}
</style>

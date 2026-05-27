<script lang="ts">
	import type { QuarantineLot } from '$lib/types/nc';

	type Props = {
		lots: QuarantineLot[];
		onexport?: () => void;
	};

	let { lots, onexport }: Props = $props();
</script>

<section class="panel">
	<h3>Lots en quarantaine</h3>

	<ul>
		{#each lots as item}
			<li>
				<a href="/fiche-lot/{encodeURIComponent(item.lot)}">{item.lot}</a>
				— {item.detail}
			</li>
		{/each}
	</ul>

	<button type="button" class="export" onclick={onexport}>Exporter la liste</button>
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.panel h3 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #0f172a;
	}

	ul {
		flex: 1;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		font-size: 0.875rem;
		line-height: 1.5;
		color: #334155;
	}

	a {
		color: #0d9488;
		font-weight: 500;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	.export {
		align-self: flex-start;
		margin-top: 1.25rem;
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.875rem;
		color: #334155;
		cursor: pointer;
	}

	.export:hover {
		background: #f8fafc;
	}
</style>

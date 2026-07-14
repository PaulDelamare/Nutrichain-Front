<script lang="ts">
	import TraceStep from './TraceStep.svelte';
	import type { TraceGraph } from '$lib/types/trace';

	let { graph }: { graph: TraceGraph } = $props();

	const hasUpstream = $derived(graph.upstream.length > 0);
	const hasDownstream = $derived(graph.downstream.length > 0);
</script>

<div class="genealogy">
	{#if hasUpstream}
		<section class="band amont">
			<header>
				<span class="tag">En amont</span>
				<p>Matières premières et lots utilisés pour fabriquer ce lot</p>
			</header>
			<div class="cards">
				{#each graph.upstream as node (node.title)}
					<TraceStep {...node} />
				{/each}
			</div>
		</section>

		<div class="flow" aria-hidden="true">
			<span class="chevron">↓</span>
			<span class="flow-label">transformés en</span>
		</div>
	{/if}

	<section class="band focus">
		<header>
			<span class="tag tag-focus">Lot analysé</span>
			<p>Le lot dont on retrace l'origine et la descendance</p>
		</header>
		<div class="cards">
			<TraceStep {...graph.selected} />
		</div>
	</section>

	{#if hasDownstream}
		<div class="flow" aria-hidden="true">
			<span class="chevron">↓</span>
			<span class="flow-label">a servi à produire</span>
		</div>

		<section class="band aval">
			<header>
				<span class="tag">En aval</span>
				<p>Lots issus de ce lot (produits finis, sous-produits)</p>
			</header>
			<div class="cards">
				{#each graph.downstream as node (node.title)}
					<TraceStep {...node} />
				{/each}
			</div>
		</section>
	{/if}

	{#if !hasUpstream && !hasDownstream}
		<p class="isolated">
			Ce lot n'a ni lot parent ni lot issu enregistré : il n'a pas encore été transformé, et n'est
			issu d'aucune transformation.
		</p>
	{/if}
</div>

<style>
	.genealogy {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.5rem;
		max-width: 46rem;
	}

	.band {
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem 1.25rem;
		background: #f8fafc;
	}

	.band.focus {
		background: #eef2ff;
		border-color: #c7d2fe;
	}

	.band header {
		margin-bottom: 0.75rem;
	}

	.tag {
		display: inline-block;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--nc-brand-dark);
		background: #dcfce7;
		padding: 0.15rem 0.5rem;
		border-radius: 0.375rem;
	}

	.tag-focus {
		color: #3730a3;
		background: #e0e7ff;
	}

	.band header p {
		margin: 0.4rem 0 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.cards {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.cards :global(.step) {
		flex: 1 1 18rem;
	}

	.flow {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		padding: 0.25rem 0;
		color: var(--nc-text-muted);
	}

	.chevron {
		font-size: 1.25rem;
		line-height: 1;
		color: #94a3b8;
	}

	.flow-label {
		font-size: 0.75rem;
		font-style: italic;
	}

	.isolated {
		padding: 1.25rem;
		border: 1px dashed #cbd5e1;
		border-radius: 0.5rem;
		color: var(--nc-text-muted);
		font-size: 0.875rem;
		text-align: center;
	}
</style>

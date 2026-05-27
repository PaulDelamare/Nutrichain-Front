<script lang="ts">
	import TraceStep from './TraceStep.svelte';
	import type { TraceStep as Step } from '$lib/types/trace';

	type Props = {
		steps: Step[];
	};

	let { steps }: Props = $props();
</script>

<div class="tree">
	{#each steps as step, i}
		<TraceStep {...step} />
		{#if i < steps.length - 1}
			<div class="link" aria-hidden="true"></div>
		{/if}
	{/each}
</div>

<style>
	.tree {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 42rem;
	}

	.link {
		width: 2px;
		height: 1.25rem;
		background: #cbd5e1;
	}
</style>

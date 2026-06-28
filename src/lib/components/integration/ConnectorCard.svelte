<script lang="ts">
	import SyncBadge from './SyncBadge.svelte';
	import type { Connector } from '$lib/types/integration';

	type Props = {
		connector: Connector;
	};

	let { connector }: Props = $props();
</script>

<article class="card">
	<div class="head">
		<h3>{connector.name}</h3>
		<SyncBadge statut={connector.statut} />
	</div>
	<ul>
		{#each connector.lines as line}
			<li>{line}</li>
		{/each}
	</ul>
</article>

<style>
	.card {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.head h3 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--nc-text-muted);
	}

	li + li {
		margin-top: 0.25rem;
	}
</style>

<script lang="ts">
	import SearchField from './SearchField.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';

	type Props = {
		title: string;
		coldAlerts?: number;
	};

	let { title, coldAlerts = 3 }: Props = $props();

	const pageSearch = usePageSearch();
</script>

<header class="topbar">
	<h1 class="topbar-title">{title}</h1>

	<div class="topbar-search">
		<SearchField
			bind:value={pageSearch.query}
			placeholder={pageSearch.placeholder}
			disabled={!pageSearch.active}
		/>
	</div>

	<div class="topbar-actions">
		{#if coldAlerts > 0}
			<span class="badge-alert">{coldAlerts} alertes froid</span>
		{/if}
		<a href="/deconnexion" class="logout">Déconnexion</a>
	</div>
</header>

<style>
	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 1rem;
		height: 3.5rem;
		padding: 0 1.5rem;
		overflow: hidden;
		border-bottom: 1px solid #e2e8f0;
		background: #fff;
	}

	.topbar-title {
		flex: 0 0 auto;
		max-width: 12rem;
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #0f172a;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.topbar-search {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		min-width: 0;
	}

	.topbar-actions {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		gap: 1rem;
	}

	.badge-alert {
		padding: 0.35rem 0.75rem;
		border-radius: 9999px;
		background: #e0f2fe;
		color: #0369a1;
		font-size: 0.8125rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.logout {
		font-size: 0.875rem;
		color: #475569;
		text-decoration: none;
		white-space: nowrap;
	}

	.logout:hover {
		color: #0f172a;
	}

	@media (max-width: 900px) {
		.topbar {
			flex-wrap: wrap;
			height: auto;
			padding: 0.75rem 1rem;
		}

		.topbar-title {
			order: 1;
		}

		.topbar-actions {
			order: 2;
			margin-left: auto;
		}

		.topbar-search {
			order: 3;
			flex: 1 1 100%;
			justify-content: stretch;
		}
	}
</style>

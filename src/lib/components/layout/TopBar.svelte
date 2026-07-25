<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import SearchField from './SearchField.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';

	type Props = {
		title: string;
		coldAlerts: number | null;
		sidebarCollapsed?: boolean;
		onMenuToggle?: () => void;
	};

	let { title, coldAlerts, sidebarCollapsed = false, onMenuToggle }: Props = $props();

	const pageSearch = usePageSearch();
</script>

<header class="topbar">
	<div class="topbar-leading">
		<div class="menu-toggle-slot" class:visible={sidebarCollapsed}>
			<button
				type="button"
				class="icon-btn menu-toggle-btn"
				onclick={onMenuToggle}
				aria-label="Ouvrir le menu"
				aria-expanded={false}
				tabindex={sidebarCollapsed ? 0 : -1}
			>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M4 7h16M4 12h16M4 17h16"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</div>
	</div>

	<h1 class="topbar-title">{title}</h1>

	<div class="topbar-search">
		<SearchField
			bind:value={pageSearch.query}
			placeholder={pageSearch.placeholder}
			disabled={!pageSearch.active}
		/>
	</div>

	<div class="topbar-actions">
		{#if coldAlerts !== null && coldAlerts > 0}
			<span class="badge-alert">{coldAlerts} alerte{coldAlerts > 1 ? 's' : ''} froid</span>
		{/if}
		<form method="POST" action={resolve('/deconnexion')} use:enhance>
			<button type="submit" class="logout">Déconnexion</button>
		</form>
	</div>
</header>

<style>
	.topbar {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 1rem;
		height: 3.5rem;
		flex-shrink: 0;
		padding: 0 1.5rem;
		overflow: hidden;
		border-bottom: 1px solid #e2e8f0;
		background: #fff;
		--shell-ease: cubic-bezier(0.4, 0, 0.2, 1);
		--shell-duration: 0.28s;
	}

	.topbar-leading {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
		margin-right: -0.25rem;
		transition: gap var(--shell-duration) var(--shell-ease);
	}

	.menu-toggle-slot {
		display: flex;
		overflow: hidden;
		max-width: 0;
		opacity: 0;
		transform: translateX(-0.35rem);
		transition:
			max-width var(--shell-duration) var(--shell-ease),
			opacity calc(var(--shell-duration) * 0.85) var(--shell-ease),
			transform var(--shell-duration) var(--shell-ease);
		pointer-events: none;
	}

	.menu-toggle-slot.visible {
		max-width: 2.5rem;
		opacity: 1;
		transform: translateX(0);
		pointer-events: auto;
	}

	.menu-toggle-btn {
		flex-shrink: 0;
	}

	.topbar-title {
		flex: 0 0 auto;
		max-width: 12rem;
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--nc-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: transform var(--shell-duration) var(--shell-ease);
	}

	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		height: 2.25rem;
		min-width: 2.25rem;
		padding: 0 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		color: var(--nc-text-muted);
		cursor: pointer;
		flex-shrink: 0;
		text-decoration: none;
		font: inherit;
	}

	.icon-btn:hover {
		background: #f8fafc;
		color: var(--nc-text);
	}

	.icon-btn svg {
		width: 1.125rem;
		height: 1.125rem;
		flex-shrink: 0;
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

	.topbar-actions form {
		display: flex;
	}

	.logout {
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
		white-space: nowrap;
		cursor: pointer;
	}

	.logout:hover {
		color: var(--nc-text);
	}

	@media (max-width: 900px) {
		.topbar {
			flex-wrap: wrap;
			height: auto;
			padding: 0.75rem 1rem;
		}

		.topbar-leading {
			order: 0;
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

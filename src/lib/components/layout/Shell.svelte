<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { headerTitle, navPourRole } from '$lib/config/nav';
	import type { KnownRole } from '$lib/config/roles';
	import { initPageSearchContext } from '$lib/context/pageSearch.svelte';
	import SideNav from './SideNav.svelte';
	import TopBar from './TopBar.svelte';

	let {
		children,
		coldAlerts,
		role
	}: { children: Snippet; coldAlerts: number | null; role: KnownRole } = $props();

	const groups = $derived(navPourRole(role));

	let collapsed = $state(false);
	const pageSearch = initPageSearchContext();

	const title = $derived(headerTitle($page.url.pathname));

	$effect(() => {
		// dépendance réactive : reset de la recherche à chaque navigation
		void $page.url.pathname;
		pageSearch.resetQuery();
	});
</script>

<div class="shell">
	<SideNav {collapsed} {groups} onMenuToggle={() => (collapsed = !collapsed)} />

	<div class="shell-main">
		<TopBar
			{title}
			{coldAlerts}
			sidebarCollapsed={collapsed}
			onMenuToggle={() => (collapsed = !collapsed)}
		/>
		<main class="shell-content">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.shell {
		display: flex;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		background: #f1f5f9;
		--shell-duration: 0.28s;
		--shell-ease: cubic-bezier(0.4, 0, 0.2, 1);
	}

	.shell-main {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		transition: flex var(--shell-duration, 0.28s) cubic-bezier(0.4, 0, 0.2, 1);
	}

	.shell-content {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 1.5rem;
	}
</style>

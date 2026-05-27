<script lang="ts">
	import { page } from '$app/stores';
	import { headerTitle } from '$lib/config/nav';
	import { initPageSearchContext } from '$lib/context/pageSearch.svelte';
	import SideNav from './SideNav.svelte';
	import TopBar from './TopBar.svelte';

	let { children } = $props();

	let collapsed = $state(false);
	const pageSearch = initPageSearchContext();

	const title = $derived(headerTitle($page.url.pathname));

	$effect(() => {
		$page.url.pathname;
		pageSearch.resetQuery();
	});
</script>

<div class="shell">
	<SideNav {collapsed} ontoggle={() => (collapsed = !collapsed)} />

	<div class="shell-main">
		<TopBar {title} />
		<main class="shell-content">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.shell {
		display: flex;
		min-height: 100vh;
		background: #f1f5f9;
	}

	.shell-main {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}

	.shell-content {
		flex: 1;
		padding: 1.5rem;
	}
</style>

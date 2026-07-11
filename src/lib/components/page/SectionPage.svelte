<script lang="ts">
	import { page } from '$app/stores';
	import { findNavItem } from '$lib/config/nav';
	import PageHead from './PageHead.svelte';
	import Placeholder from './Placeholder.svelte';

	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
	};

	let { children }: Props = $props();

	const item = $derived(findNavItem($page.url.pathname));
</script>

{#if item}
	<PageHead heading={item.heading} description={item.description} />
	{#if children}
		{@render children()}
	{:else}
		<Placeholder />
	{/if}
{/if}

<script lang="ts">
	import Shell from '$lib/components/layout/Shell.svelte';

	let { children } = $props();
</script>

<Shell>
	{@render children()}
</Shell>

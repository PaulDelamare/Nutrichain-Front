<script lang="ts">
	import Shell from '$lib/components/layout/Shell.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
</script>

<Shell coldAlerts={data.coldAlerts} role={data.user.role}>
	{@render children()}
</Shell>

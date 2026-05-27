<script lang="ts">
	import PageHead from '$lib/components/page/PageHead.svelte';
	import UserTable from '$lib/components/users/UserTable.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageSearch = usePageSearch();

	$effect(() => {
		pageSearch.configure('Rechercher email, rôle…');
		return () => pageSearch.deactivate();
	});

	const users = $derived(
		filterRowsByText(data.users, pageSearch.query, (u) => [u.email, u.role, u.lastLogin])
	);
</script>

<PageHead
	heading="Utilisateurs, rôles & sécurité"
	description="Gestion des accès — RBAC, MFA, politique de mot de passe."
/>

{#if data.source === 'mock' && data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

<UserTable rows={users} />

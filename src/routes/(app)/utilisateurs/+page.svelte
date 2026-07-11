<script lang="ts">
	import InviteUserForm from '$lib/components/users/InviteUserForm.svelte';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import UserTable from '$lib/components/users/UserTable.svelte';
	import { usePageSearch } from '$lib/context/pageSearch.svelte';
	import { filterRowsByText } from '$lib/utils/pageSearch/filterByText';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

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

<InviteUserForm {form} canInvite={data.canInvite} />

<UserTable rows={users} />

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}
</style>

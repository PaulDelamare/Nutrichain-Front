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
		filterRowsByText(data.users, pageSearch.query, (u) => [u.email, u.role])
	);
</script>

<PageHead
	heading="Utilisateurs, rôles & sécurité"
	description="Gestion des accès — RBAC, MFA, politique de mot de passe."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

{#if form?.error}
	<p class="banner err">{form.error}</p>
{:else if form?.success}
	<p class="banner ok">{form.message}</p>
{/if}

<InviteUserForm {form} canInvite={data.canInvite} />

<UserTable rows={users} canManage={data.canManage} currentUserId={data.currentUserId} />

<style>
	.banner.err {
		background: #fef2f2;
		color: #991b1b;
	}

	.banner.ok {
		background: #f0fdf4;
		color: #166534;
	}

	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}
</style>

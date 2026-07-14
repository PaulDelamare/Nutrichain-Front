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

	const isMemberForm = $derived(form && 'scope' in form && form.scope === 'member');
	const inviteForm = $derived(isMemberForm ? null : form);
	const memberForm = $derived(isMemberForm ? form : null);
</script>

<PageHead
	heading="Utilisateurs, rôles & sécurité"
	description="Gestion des accès — RBAC, MFA, politique de mot de passe."
/>

{#if data.error}
	<p class="banner">API indisponible — {data.error}</p>
{/if}

<InviteUserForm form={inviteForm} canInvite={data.canInvite} />

{#if memberForm?.success}
	<p class="feedback success">{memberForm.message}</p>
{:else if memberForm?.error}
	<p class="feedback error">{memberForm.error}</p>
{/if}

<UserTable rows={users} canManage={data.canInvite} currentUserId={data.currentUserId} />

<style>
	.banner {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.8125rem;
	}

	.feedback {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}

	.feedback.success {
		background: rgba(27, 107, 92, 0.08);
		color: var(--nc-brand-dark);
	}

	.feedback.error {
		background: #fef2f2;
		color: #991b1b;
	}
</style>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import MfaBadge from './MfaBadge.svelte';
	import { INVITE_ROLE_OPTIONS } from '$lib/config/invite-roles';
	import type { AppUser } from '$lib/types/user';

	type Props = {
		rows: AppUser[];
		canManage?: boolean;
		currentUserId?: string;
	};

	let { rows, canManage = false, currentUserId }: Props = $props();

	const columns = $derived(
		canManage ? ['Utilisateur', 'Rôle', 'MFA', 'Actions'] : ['Utilisateur', 'Rôle', 'MFA']
	);

	function estGerable(row: AppUser): boolean {
		return canManage && row.rawRole !== 'owner' && row.userId !== currentUserId;
	}

	const apresAction =
		() =>
		async ({ result, update }: { result: { type: string }; update: () => Promise<void> }) => {
			if (result.type === 'success') await invalidateAll();
			await update();
		};

	function confirmerRevocation(email: string, event: SubmitEvent) {
		if (
			!confirm(
				`Révoquer l'accès de ${email} ? Ses sessions seront fermées et ses invitations en attente annulées.`
			)
		) {
			event.preventDefault();
		}
	}
</script>

<DataTable
	{columns}
	{rows}
	rowKey={(r) => r.memberId}
	empty="Aucun utilisateur ne correspond aux filtres."
>
	{#snippet row(r)}
		<td class="email">{r.email}</td>
		<td>{r.role}</td>
		<td><MfaBadge enabled={r.mfa} /></td>
		{#if canManage}
			<td>
				{#if estGerable(r)}
					<div class="actions">
						<form method="POST" action="?/changeRole" class="role-form" use:enhance={apresAction}>
							<input type="hidden" name="memberId" value={r.memberId} />
							<select name="role" aria-label={`Rôle de ${r.email}`}>
								{#each INVITE_ROLE_OPTIONS as opt (opt.value)}
									<option value={opt.value} selected={opt.value === r.rawRole}>
										{opt.label}
									</option>
								{/each}
							</select>
							<button type="submit" class="apply">Appliquer</button>
						</form>
						<form
							method="POST"
							action="?/revoke"
							use:enhance={apresAction}
							onsubmit={(e) => confirmerRevocation(r.email, e)}
						>
							<input type="hidden" name="memberId" value={r.memberId} />
							<button type="submit" class="danger">Révoquer</button>
						</form>
					</div>
				{:else}
					<span class="muted">—</span>
				{/if}
			</td>
		{/if}
	{/snippet}
</DataTable>

<style>
	.email {
		color: var(--nc-text);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.role-form {
		display: flex;
		gap: 0.35rem;
		align-items: center;
	}

	select {
		height: 2rem;
		padding: 0 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		color: var(--nc-text);
		font-size: 0.8125rem;
	}

	button {
		height: 2rem;
		padding: 0 0.75rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.apply {
		background: var(--nc-brand);
		color: #fff;
	}

	.apply:hover {
		background: var(--nc-brand-hover);
	}

	.danger {
		background: #fff;
		border-color: #fecaca;
		color: #991b1b;
	}

	.danger:hover {
		background: #fef2f2;
	}

	.muted {
		color: var(--nc-text-subtle);
	}
</style>

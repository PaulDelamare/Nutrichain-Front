<script lang="ts">
	import MfaBadge from './MfaBadge.svelte';
	import { INVITE_ROLE_OPTIONS } from '$lib/config/invite-roles';
	import type { AppUser } from '$lib/types/user';

	type Props = {
		rows: AppUser[];
		/** L'utilisateur courant peut-il administrer les membres (owner/admin) ? */
		canManage?: boolean;
		/** Pour masquer les actions sur sa propre ligne : on ne modifie pas son propre accès. */
		currentUserId?: string;
	};

	let { rows, canManage = false, currentUserId }: Props = $props();

	// Le propriétaire ancre la gouvernance de l'organisation et n'est pas modifiable ; personne ne
	// gère non plus son propre accès. L'API refuse déjà ces deux cas — on ne montre simplement pas
	// des commandes vouées à un 403.
	function estGerable(row: AppUser): boolean {
		return canManage && row.rawRole !== 'owner' && row.userId !== currentUserId;
	}

	function confirmerRevocation(event: SubmitEvent) {
		if (!confirm('Révoquer cet accès ? La personne sera déconnectée immédiatement.')) {
			event.preventDefault();
		}
	}
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Utilisateur</th>
				<th>Rôle</th>
				<th>Dernière connexion</th>
				<th>MFA</th>
				{#if canManage}
					<th>Actions</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.email)}
				<tr>
					<td class="email">{row.email}</td>
					<td>{row.role}</td>
					<td>{row.lastLogin}</td>
					<td><MfaBadge enabled={row.mfa} /></td>
					{#if canManage}
						<td>
							{#if estGerable(row)}
								<div class="actions">
									<form method="POST" action="?/changeRole" class="role-form">
										<input type="hidden" name="memberId" value={row.memberId} />
										<select name="role" aria-label={`Rôle de ${row.email}`}>
											{#each INVITE_ROLE_OPTIONS as opt (opt.value)}
												<option value={opt.value} selected={opt.value === row.rawRole}>
													{opt.label}
												</option>
											{/each}
										</select>
										<button type="submit" class="apply">Appliquer</button>
									</form>
									<form method="POST" action="?/revoke" onsubmit={confirmerRevocation}>
										<input type="hidden" name="memberId" value={row.memberId} />
										<button type="submit" class="danger">Révoquer</button>
									</form>
								</div>
							{:else}
								<span class="muted">—</span>
							{/if}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		overflow-x: auto;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e2e8f0;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--nc-text-muted);
		background: #f8fafc;
		white-space: nowrap;
	}

	td {
		padding: 0.875rem 1rem;
		border-bottom: 1px solid #f1f5f9;
		color: var(--nc-text-muted);
		vertical-align: middle;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.email {
		color: var(--nc-text);
	}

	.actions {
		display: flex;
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

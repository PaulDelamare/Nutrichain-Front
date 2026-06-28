<script lang="ts">
	import MfaBadge from './MfaBadge.svelte';
	import type { AppUser } from '$lib/types/user';

	type Props = {
		rows: AppUser[];
	};

	let { rows }: Props = $props();
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Utilisateur</th>
				<th>Rôle</th>
				<th>Dernière connexion</th>
				<th>MFA</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr>
					<td class="email">{row.email}</td>
					<td>{row.role}</td>
					<td>{row.lastLogin}</td>
					<td><MfaBadge enabled={row.mfa} /></td>
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
</style>

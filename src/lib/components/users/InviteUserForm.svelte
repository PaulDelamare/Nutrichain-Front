<script lang="ts">
	import { INVITE_ROLE_OPTIONS } from '$lib/config/invite-roles';

	type InviteFormState = {
		success?: boolean;
		message?: string;
		error?: string;
		email?: string;
		role?: string;
	} | null;

	type Props = {
		form: InviteFormState;
		canInvite: boolean;
	};

	let { form, canInvite }: Props = $props();
</script>

{#if canInvite}
	<section class="invite-card">
		<h3>Inviter un utilisateur</h3>
		<p class="hint">
			Un e-mail d'invitation sera envoyé. La personne pourra créer son compte via le lien reçu.
		</p>

		<form method="POST" action="?/invite" class="invite-form">
			{#if form?.success}
				<p class="success">{form.message}</p>
			{/if}
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			<label>
				<span>Adresse e-mail</span>
				<input
					type="email"
					name="email"
					value={form?.email ?? ''}
					required
					autocomplete="email"
				/>
			</label>

			<label>
				<span>Rôle</span>
				<select name="role" required>
					{#each INVITE_ROLE_OPTIONS as opt}
						<option value={opt.value} selected={opt.value === (form?.role ?? 'operator')}>
							{opt.label}
						</option>
					{/each}
				</select>
			</label>

			<button type="submit">Envoyer l'invitation</button>
		</form>
	</section>
{:else}
	<p class="readonly-hint">Seuls les administrateurs peuvent inviter de nouveaux utilisateurs.</p>
{/if}

<style>
	.invite-card {
		margin-bottom: 1.25rem;
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	h3 {
		margin: 0 0 0.35rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.hint {
		margin: 0 0 1rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.invite-form {
		display: grid;
		grid-template-columns: 1fr minmax(10rem, 12rem) auto;
		gap: 0.75rem;
		align-items: end;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	label span {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--nc-text-muted);
	}

	input,
	select {
		height: 2.25rem;
		padding: 0 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		color: var(--nc-text);
		font-size: 0.875rem;
	}

	button {
		height: 2.25rem;
		padding: 0 1rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	button:hover {
		background: var(--nc-brand-hover);
	}

	.success {
		grid-column: 1 / -1;
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: rgba(27, 107, 92, 0.08);
		color: var(--nc-brand-dark);
		font-size: 0.8125rem;
	}

	.error {
		grid-column: 1 / -1;
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fef2f2;
		color: #991b1b;
		font-size: 0.8125rem;
	}

	.readonly-hint {
		margin: 0 0 1rem;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}

	@media (max-width: 900px) {
		.invite-form {
			grid-template-columns: 1fr;
		}

		button {
			width: 100%;
		}
	}
</style>

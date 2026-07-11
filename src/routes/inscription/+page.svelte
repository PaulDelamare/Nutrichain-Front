<script lang="ts">
	import { APP_NAME, APP_TAGLINE } from '$lib/config/app';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="register-page">
	<section class="card">
		<div class="brand">
			<div class="logo" aria-hidden="true">N</div>
			<h1>{APP_NAME}</h1>
			<p>{APP_TAGLINE}</p>
		</div>

		{#if data.invitation}
			<div class="invite-banner">
				<p>Invitation pour <strong>{data.invitation.email}</strong></p>
				<p class="meta">
					Rôle : {data.invitation.role} · Valide jusqu'au {data.invitation.expiresAt}
				</p>
			</div>
		{:else}
			<p class="intro">Création de compte réservée aux utilisateurs invités.</p>
		{/if}

		<form class="form" method="POST">
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			{#if data.token}
				<input type="hidden" name="token" value={data.token} />
			{/if}

			<label>
				<span>Nom complet</span>
				<input type="text" name="name" value={form?.name ?? ''} autocomplete="name" required />
			</label>

			<label>
				<span>Adresse e-mail</span>
				<input
					type="email"
					name="email"
					value={form?.email ?? data.invitation?.email ?? ''}
					autocomplete="username"
					required
					readonly={Boolean(data.invitation?.email)}
				/>
			</label>

			<label>
				<span>Mot de passe</span>
				<input type="password" name="password" autocomplete="new-password" required minlength="8" />
			</label>

			<button type="submit">Créer mon compte</button>
		</form>

		<p class="hint">
			Déjà un compte ?
			<a href="/connexion">Se connecter</a>
		</p>
	</section>
</main>

<style>
	.register-page {
		display: grid;
		place-items: center;
		min-height: 100vh;
		padding: 1rem;
		background: linear-gradient(180deg, #f0f7f5 0%, #e8f3f0 100%);
	}

	.card {
		width: min(100%, 27rem);
		padding: 1.5rem 1.5rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		background: #fff;
		box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
	}

	.brand {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 1rem;
	}

	.logo {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: var(--nc-brand);
		color: #fff;
		font-weight: 700;
	}

	h1 {
		margin: 0.5rem 0 0.25rem;
		font-size: 2rem;
		line-height: 1.1;
		color: var(--nc-text);
	}

	.brand p {
		margin: 0;
		font-size: 0.75rem;
		color: var(--nc-text-subtle);
		text-align: center;
	}

	.invite-banner {
		margin-bottom: 1rem;
		padding: 0.75rem;
		border-radius: 0.375rem;
		background: rgba(27, 107, 92, 0.08);
	}

	.invite-banner p {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text);
	}

	.meta {
		margin-top: 0.25rem !important;
		color: var(--nc-text-muted) !important;
	}

	.intro {
		margin: 0 0 1rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
		text-align: center;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	label span {
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}

	input {
		height: 2.25rem;
		padding: 0 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
		color: var(--nc-text);
		font-size: 0.875rem;
	}

	input[readonly] {
		background: #f8fafc;
	}

	button {
		height: 2.25rem;
		margin-top: 0.25rem;
		border: none;
		border-radius: 0.5rem;
		background: var(--nc-brand);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	button:hover {
		background: var(--nc-brand-hover);
	}

	.error {
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fef2f2;
		color: #991b1b;
		font-size: 0.8125rem;
	}

	.hint {
		margin: 0.9rem 0 0;
		font-size: 0.75rem;
		color: var(--nc-text-subtle);
		text-align: center;
	}

	.hint a {
		color: var(--nc-brand);
		font-weight: 600;
		text-decoration: none;
	}
</style>

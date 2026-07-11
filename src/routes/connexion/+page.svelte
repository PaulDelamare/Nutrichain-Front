<script lang="ts">
	import { APP_NAME } from '$lib/config/app';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<main class="login-page">
	<section class="card">
		<div class="brand">
			<div class="logo" aria-hidden="true">N</div>
			<h1>{APP_NAME}</h1>
			<p>Plateforme de traçabilité — ferme au rayon</p>
		</div>

		<form class="form" method="POST">
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			<label>
				<span>Adresse e-mail</span>
				<input
					type="email"
					name="email"
					value={form?.email ?? 'nutrichain@test.fr'}
					autocomplete="username"
					required
				/>
			</label>

			<label>
				<span>Mot de passe</span>
				<input type="password" name="password" autocomplete="current-password" required />
			</label>

			<button type="submit">Se connecter</button>
		</form>

		<p class="hint">Connexion via l'API NutriChain — session cookie</p>
	</section>
</main>

<style>
	.login-page {
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
		caret-color: var(--nc-text);
		font-size: 0.875rem;
	}

	input::placeholder {
		color: var(--nc-text-subtle);
	}

	input:-webkit-autofill,
	input:-webkit-autofill:hover,
	input:-webkit-autofill:focus {
		-webkit-text-fill-color: var(--nc-text);
		box-shadow: 0 0 0 1000px #fff inset;
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
		font-size: 0.6875rem;
		color: var(--nc-text-subtle);
		text-align: center;
	}
</style>

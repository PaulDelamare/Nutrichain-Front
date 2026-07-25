<script lang="ts">
	import QRCode from 'qrcode';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Le pas d'enrôlement (QR affiché, en attente du code de confirmation) ne survit qu'à cet
	// écran : dès que `form.totpURI` disparaît (rechargement, autre action), on revient à l'état
	// « désactivé/activé » lu depuis `data`. Pas de session côté client à gérer.
	let qrDataUrl = $state<string | null>(null);

	$effect(() => {
		if (form && 'totpURI' in form && form.totpURI) {
			QRCode.toDataURL(form.totpURI).then((url) => (qrDataUrl = url));
		} else {
			qrDataUrl = null;
		}
	});

	const enrolling = $derived(Boolean(form && 'totpURI' in form && form.totpURI));
	const confirmed = $derived(Boolean(form && 'confirmed' in form && form.confirmed));
	const disabled = $derived(Boolean(form && 'disabled' in form && form.disabled));
	// Après confirmation ou désactivation, l'état réel a changé côté serveur mais `data.twoFactorEnabled`
	// ne se recharge pas sans navigation : on le déduit localement pour un retour visuel immédiat.
	const twoFactorEnabled = $derived(confirmed ? true : disabled ? false : data.twoFactorEnabled);
</script>

<svelte:head>
	<title>Mon compte — NutriChain</title>
</svelte:head>

<main class="account-page">
	<h1>Mon compte</h1>

	<section class="card">
		<h2>Authentification à deux facteurs (2FA)</h2>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		{#if confirmed}
			<p class="success">2FA activée : elle sera demandée à chaque connexion.</p>
		{/if}

		{#if disabled}
			<p class="success">2FA désactivée.</p>
		{/if}

		{#if enrolling && qrDataUrl}
			<p>
				Scannez ce QR code avec votre application d'authentification (Google Authenticator, etc.).
			</p>
			<img src={qrDataUrl} alt="QR code d'enrôlement 2FA" class="qr" />

			{#if form && 'backupCodes' in form && form.backupCodes}
				<div class="backup-codes">
					<p><strong>Codes de secours</strong> — notez-les, ils ne seront plus jamais affichés :</p>
					<ul>
						{#each form.backupCodes as code (code)}
							<li>{code}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<form class="form" method="POST" action="?/confirm">
				<label>
					<span>Code affiché dans l'application</span>
					<input
						type="text"
						name="code"
						inputmode="numeric"
						pattern="[0-9]*"
						maxlength="6"
						autocomplete="one-time-code"
						required
					/>
				</label>
				<button type="submit">Confirmer l'activation</button>
			</form>
		{:else if twoFactorEnabled}
			<p>La 2FA est activée sur votre compte.</p>
			<form class="form" method="POST" action="?/disable">
				<label>
					<span>Mot de passe</span>
					<input type="password" name="password" autocomplete="current-password" required />
				</label>
				<button type="submit" class="danger">Désactiver la 2FA</button>
			</form>
		{:else}
			<p>La 2FA n'est pas activée sur votre compte.</p>
			<form class="form" method="POST" action="?/enable">
				<label>
					<span>Mot de passe</span>
					<input type="password" name="password" autocomplete="current-password" required />
				</label>
				<button type="submit">Activer la 2FA</button>
			</form>
		{/if}
	</section>
</main>

<style>
	.account-page {
		max-width: 32rem;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	h1 {
		margin: 0 0 1rem;
		color: var(--nc-text);
	}

	.card {
		padding: 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		background: #fff;
	}

	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.1rem;
		color: var(--nc-text);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.75rem;
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
		font-size: 0.875rem;
	}

	button {
		height: 2.25rem;
		border: none;
		border-radius: 0.5rem;
		background: var(--nc-brand);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	button.danger {
		background: #b91c1c;
	}

	.qr {
		display: block;
		width: 12rem;
		height: 12rem;
		margin: 0.75rem 0;
	}

	.backup-codes {
		margin: 0.75rem 0;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: #f8fafc;
		font-size: 0.8125rem;
	}

	.backup-codes ul {
		margin: 0.5rem 0 0;
		padding-left: 1.25rem;
		font-family: monospace;
	}

	.error {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fef2f2;
		color: #991b1b;
		font-size: 0.8125rem;
	}

	.success {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #f0fdf4;
		color: #166534;
		font-size: 0.8125rem;
	}
</style>

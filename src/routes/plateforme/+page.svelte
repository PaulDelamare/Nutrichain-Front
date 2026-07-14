<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let inviteFor = $state<string | null>(null);
	// Empêche le double-envoi : le bouton se désactive le temps de la soumission.
	let envoi = $state(false);
	const pendant = () => {
		envoi = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			envoi = false;
		};
	};
</script>

<svelte:head><title>Console plateforme — NutriChain</title></svelte:head>

<main>
	<header class="head">
		<div>
			<h1>Console plateforme</h1>
			<p>Créer et piloter les organisations clientes. Aucune donnée métier n'est accessible ici.</p>
		</div>
		<div class="who">
			<span>{data.user.email}</span>
			<form method="POST" action="/deconnexion" use:enhance>
				<button type="submit" class="logout">Déconnexion</button>
			</form>
		</div>
	</header>

	{#if data.error}
		<p class="banner">Chargement impossible — {data.error}</p>
	{/if}

	<section class="create">
		<h2>Nouvelle organisation</h2>
		<form method="POST" action="?/create" use:enhance={pendant}>
			<label>
				<span>Nom</span>
				<input
					name="name"
					placeholder="Ex. : Fromagerie des Alpes"
					required
					minlength="2"
					value={form?.name ?? ''}
				/>
			</label>
			<label>
				<span>Identifiant court (optionnel)</span>
				<input name="slug" placeholder="déduit du nom si vide" />
			</label>
			<label>
				<span>Préfixe GS1 (optionnel)</span>
				<input name="gs1_company_prefix" placeholder="6 à 12 chiffres" inputmode="numeric" />
			</label>
			<button type="submit" disabled={envoi}>Créer l'organisation</button>
		</form>
		{#if form?.createError}
			<p class="error" role="alert">{form.createError}</p>
		{:else if form?.created}
			<p class="ok" role="status">
				✅ « {form.created.name} » créée. Invitez son premier responsable ci-dessous pour l'activer.
			</p>
		{/if}
	</section>

	<section class="list">
		<h2>Organisations ({data.organizations.length})</h2>

		{#if data.organizations.length === 0}
			<p class="empty">Aucune organisation pour l'instant.</p>
		{:else}
			<ul>
				{#each data.organizations as org (org.id)}
					<li>
						<div class="org">
							<div>
								<p class="name">{org.name}</p>
								<p class="slug">{org.slug}</p>
							</div>
							{#if org.membersCount === 0}
								<!-- Une organisation sans membre n'a pas de pilote : elle est inutilisable tant
								     que son premier responsable n'a pas accepté son invitation. -->
								<span class="pending">En attente d'activation</span>
							{:else}
								<span class="active"
									>{org.membersCount} membre{org.membersCount > 1 ? 's' : ''}</span
								>
							{/if}
						</div>

						{#if org.membersCount === 0}
							{#if inviteFor === org.id}
								<form method="POST" action="?/inviteOwner" use:enhance={pendant}>
									<input type="hidden" name="organizationId" value={org.id} />
									<input type="email" name="email" placeholder="e-mail du responsable" required />
									<button type="submit" disabled={envoi}>Envoyer l'invitation</button>
									<button type="button" class="ghost" onclick={() => (inviteFor = null)}
										>Annuler</button
									>
								</form>
							{:else}
								<button type="button" class="link" onclick={() => (inviteFor = org.id)}>
									Inviter le responsable
								</button>
							{/if}

							{#if form?.inviteError && form?.organizationId === org.id}
								<p class="error" role="alert">{form.inviteError}</p>
							{:else if form?.invited && form.invited.organizationId === org.id}
								<p class="ok" role="status">✅ Invitation envoyée à {form.invited.email}.</p>
							{/if}
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>

<style>
	main {
		max-width: 46rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.who {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
		white-space: nowrap;
	}

	.logout {
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: var(--nc-text-muted);
		cursor: pointer;
		text-decoration: underline;
	}

	.head h1 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--nc-text);
	}

	.head p {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}

	section {
		padding: 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	h2 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: flex-end;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1 1 12rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	input {
		padding: 0.45rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark, #1b6b5c);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	button.ghost,
	button.link {
		background: none;
		color: var(--nc-text-muted);
		padding: 0.35rem 0;
	}

	button.link {
		text-decoration: underline;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		padding: 0.75rem 0;
		border-bottom: 1px solid #f1f5f9;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	li:last-child {
		border-bottom: none;
	}

	.org {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.name {
		margin: 0;
		font-weight: 600;
		color: var(--nc-text);
	}

	.slug {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}

	.pending {
		padding: 0.25rem 0.6rem;
		border-radius: 9999px;
		background: #fef3c7;
		color: #92400e;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.active {
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
		white-space: nowrap;
	}

	.banner,
	.error {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: #991b1b;
	}

	.ok {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: #166534;
	}

	.empty {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nc-text-subtle);
	}
</style>

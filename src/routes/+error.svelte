<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	const estRefus = $derived($page.status === 403);
</script>

<section class="erreur">
	<p class="code">{$page.status}</p>
	<h1>{estRefus ? 'Accès refusé' : 'Une erreur est survenue'}</h1>
	<p class="message" role="alert">{$page.error?.message ?? 'Erreur inattendue.'}</p>
	<a href={resolve('/connexion')}>Retour à la connexion</a>
</section>

<style>
	.erreur {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		max-width: 32rem;
		margin: 0 auto;
		padding: 3rem 1.5rem;
	}

	.code {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		color: var(--nc-text-muted);
	}

	h1 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--nc-text);
	}

	.message {
		margin: 0;
		color: var(--nc-text);
	}

	a {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}
</style>

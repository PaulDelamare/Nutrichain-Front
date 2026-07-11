<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';

	const message = $derived($page.error?.message ?? 'Cette invitation est invalide ou a expiré.');
</script>

<main class="wrap">
	<h1>Invitation invalide</h1>
	<p>{message}</p>
	<a href={resolve('/connexion')}>Retour à la connexion</a>
</main>

<style>
	.wrap {
		display: grid;
		place-items: center;
		min-height: 100vh;
		padding: 1rem;
		text-align: center;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: var(--nc-text);
	}

	p {
		margin: 0 0 1rem;
		color: var(--nc-text-muted);
	}

	a {
		color: var(--nc-brand);
		font-weight: 600;
	}
</style>

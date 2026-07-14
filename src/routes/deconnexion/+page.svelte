<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<svelte:head><title>Déconnexion — NutriChain</title></svelte:head>

<main>
	<h1>Se déconnecter</h1>
	<p>Votre session sera fermée sur cet appareil.</p>
	<form method="POST" use:enhance>
		<button type="submit">Se déconnecter</button>
	</form>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		min-height: 100vh;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--nc-text);
	}

	p {
		margin: 0;
		color: var(--nc-text-muted);
	}

	button {
		margin-top: 0.5rem;
		padding: 0.5rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		color: var(--nc-text);
		font: inherit;
		cursor: pointer;
	}

	button:hover {
		background: #f8fafc;
	}
</style>

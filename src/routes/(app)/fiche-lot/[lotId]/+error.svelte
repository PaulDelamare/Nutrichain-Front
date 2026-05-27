<script lang="ts">
	import { page } from '$app/stores';

	const message = $derived(
		$page.error?.message ?? 'Ce lot n’existe pas ou n’est pas accessible.'
	);
	const title = $derived($page.status === 403 ? 'Accès refusé' : 'Lot introuvable');
</script>

<div class="wrap">
	<h1>{title}</h1>
	<p>{message}</p>
	<p class="id">Identifiant : <code>{$page.params.lotId}</code></p>
	<a href="/recherche-lots">← Retour à la recherche de lots</a>
</div>

<style>
	.wrap {
		max-width: 28rem;
		padding: 2rem 1.5rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: #0f172a;
	}

	p {
		margin: 0 0 0.75rem;
		color: #475569;
		font-size: 0.9375rem;
	}

	.id code {
		font-size: 0.875rem;
	}

	a {
		color: #0d9488;
		font-size: 0.875rem;
	}
</style>

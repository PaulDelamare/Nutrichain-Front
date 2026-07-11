<script lang="ts">
	import { page } from '$app/stores';

	const message = $derived($page.error?.message ?? 'Ce lot n’existe pas ou n’est pas accessible.');
	const title = $derived($page.status === 403 ? 'Accès refusé' : 'Lot introuvable');
</script>

<div class="wrap">
	<a href="/recherche-lots" class="back-link">← Retour</a>
	<h1>{title}</h1>
	<p>{message}</p>
	<p class="id">Identifiant : <code>{$page.params.lotId}</code></p>
</div>

<style>
	.wrap {
		max-width: 28rem;
		padding: 2rem 1.5rem;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nc-brand);
		text-decoration: none;
	}

	.back-link:hover {
		color: var(--nc-brand-hover);
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: var(--nc-text);
	}

	p {
		margin: 0 0 0.75rem;
		color: var(--nc-text-muted);
		font-size: 0.9375rem;
	}

	.id code {
		font-size: 0.875rem;
	}
</style>

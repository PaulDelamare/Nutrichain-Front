<script lang="ts">
	import { roleLabel, type KnownRole } from '$lib/config/roles';

	// On EXPLIQUE le refus au lieu de faire disparaître le bouton : un bouton absent passe pour un
	// oubli, une phrase montre que le cloisonnement est VOULU. C'est ce qui rend la séparation des
	// tâches HACCP démontrable.
	type Props = { action: string; role: KnownRole };

	let { action, role }: Props = $props();

	// La règle HACCP ne s'applique qu'à celui qui manipule la matière : la resservir à un lecteur
	// serait un non-sequitur. Lui, il n'a simplement aucun droit d'écriture.
	const estOperateur = $derived(role === 'operator');
</script>

<p class="reservee">
	<span class="cadenas" aria-hidden="true">🔒</span>
	<span>
		<strong>{action}</strong> est une décision qualité, réservée aux rôles qualité, administrateur
		et propriétaire. Votre rôle : {roleLabel(role)}.
		{#if estOperateur}
			Celui qui réceptionne ou transforme ne valide pas sa propre marchandise — c'est la séparation
			des tâches HACCP.
		{/if}
	</span>
</p>

<style>
	.reservee {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin: 0;
		padding: 0.625rem 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #f8fafc;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--nc-text-muted);
	}

	.cadenas {
		flex-shrink: 0;
		font-size: 0.875rem;
	}

	strong {
		color: var(--nc-text);
		font-weight: 600;
	}
</style>

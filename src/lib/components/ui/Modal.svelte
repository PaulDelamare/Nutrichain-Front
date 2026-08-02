<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		/** Contrôlé par l'appelant : la modale s'ouvre/ferme selon cette valeur. */
		open: boolean;
		title: string;
		/** Appelé quand l'utilisateur ferme (Échap, clic hors modale, bouton ×). */
		onclose?: () => void;
		children: Snippet;
	};

	let { open, title, onclose, children }: Props = $props();

	// Le Dialog (Zag) fournit focus-trap, Échap, scroll-lock et l'ARIA. On ne récupère que la
	// fermeture : l'ouverture est pilotée par l'appelant via `open`, pas par un Dialog.Trigger.
	function handleOpenChange(e: { open: boolean }) {
		if (!e.open) onclose?.();
	}
</script>

<Dialog {open} onOpenChange={handleOpenChange}>
	<Portal>
		<Dialog.Backdrop class="nc-modal-backdrop" />
		<Dialog.Positioner class="nc-modal-positioner">
			<Dialog.Content class="nc-modal-content">
				<header class="nc-modal-header">
					<Dialog.Title class="nc-modal-title">{title}</Dialog.Title>
					<Dialog.CloseTrigger class="nc-modal-close" aria-label="Fermer">×</Dialog.CloseTrigger>
				</header>
				<div class="nc-modal-body">
					{@render children()}
				</div>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>

<style>
	/* Le contenu est rendu par les sous-composants Skeleton et transféré dans <body> (Portal) : les
	   styles scopés ne l'atteindraient pas. On passe donc par :global avec des classes préfixées. */
	:global(.nc-modal-backdrop) {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgba(15, 23, 42, 0.5);
	}

	:global(.nc-modal-positioner) {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	:global(.nc-modal-content) {
		width: 100%;
		max-width: 32rem;
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
	}

	:global(.nc-modal-header) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #f1f5f9;
	}

	:global(.nc-modal-title) {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	:global(.nc-modal-close) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border: none;
		border-radius: 0.375rem;
		background: none;
		font-size: 1.25rem;
		line-height: 1;
		color: var(--nc-text-subtle);
		cursor: pointer;
	}

	:global(.nc-modal-close:hover) {
		background: #f1f5f9;
		color: var(--nc-text);
	}

	:global(.nc-modal-body) {
		padding: 1.25rem;
	}
</style>

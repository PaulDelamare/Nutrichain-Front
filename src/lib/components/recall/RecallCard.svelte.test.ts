import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import RecallCard from './RecallCard.svelte';
import type { Recall } from '$lib/types/recall';

function recall(partial: Partial<Recall> = {}): Recall {
	return {
		id: 'RAP-2026-014',
		produit: 'Bouteille de Lait 1L',
		statut: 'en_cours',
		lots: '260711-000201, 260711-000202',
		sites: 'Carrefour Nantes, Leclerc Rennes',
		etape: 'Étape 2 sur 4',
		etapeTitre: 'Notification des clients livrés',
		etapeDetail: '12 enseignes notifiées sur 14',
		...partial
	};
}

function renderCard(props: Record<string, unknown>) {
	render(RecallCard, { props } as unknown as SvelteComponentOptions<typeof RecallCard>);
}

describe('RecallCard', () => {
	it('nomme le rappel et le produit concerné', async () => {
		renderCard({ recall: recall() });
		await expect.element(page.getByText('RAP-2026-014 — Bouteille de Lait 1L')).toBeInTheDocument();
	});

	// Un rappel sans la liste des lots et des enseignes n'est pas exploitable sur le terrain.
	it('énumère les lots rappelés et les sites impactés', async () => {
		renderCard({ recall: recall() });
		await expect.element(page.getByText(/260711-000201, 260711-000202/)).toBeInTheDocument();
		await expect.element(page.getByText(/Carrefour Nantes, Leclerc Rennes/)).toBeInTheDocument();
	});

	it('situe où en est la procédure', async () => {
		renderCard({ recall: recall() });
		await expect.element(page.getByText('Étape 2 sur 4')).toBeInTheDocument();
		await expect.element(page.getByText('Notification des clients livrés')).toBeInTheDocument();
		await expect.element(page.getByText('12 enseignes notifiées sur 14')).toBeInTheDocument();
	});

	it('affiche l’état du rappel', async () => {
		renderCard({ recall: recall({ statut: 'cloture' }) });
		await expect.element(page.getByText('Clôturé')).toBeInTheDocument();
	});

	it('ne propose pas de relance quand la page n’en gère pas', async () => {
		renderCard({ recall: recall() });
		await expect
			.element(page.getByRole('button', { name: 'Notifier relance' }))
			.not.toBeInTheDocument();
	});

	it('relance la notification à la demande', async () => {
		const onnotify = vi.fn();
		renderCard({ recall: recall(), onnotify });

		await page.getByRole('button', { name: 'Notifier relance' }).click();

		expect(onnotify).toHaveBeenCalledOnce();
	});
});

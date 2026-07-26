import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import LotActionsPanel from './LotActionsPanel.svelte';

type Statut = 'conforme' | 'surveillance' | 'quarantaine';

function renderPanel(statut: Statut, form: unknown = null) {
	render(LotActionsPanel, {
		props: { lotId: 'lot-1', statut, form, role: 'quality' }
	} as unknown as SvelteComponentOptions<typeof LotActionsPanel>);
}

describe('LotActionsPanel', () => {
	it('lot conforme → propose de déclencher un rappel', async () => {
		renderPanel('conforme');
		await expect
			.element(page.getByRole('button', { name: 'Déclencher le rappel' }))
			.toBeInTheDocument();
	});

	it('lot en quarantaine → propose de lever la quarantaine', async () => {
		renderPanel('quarantaine');
		await expect
			.element(page.getByRole('button', { name: 'Lever la quarantaine' }))
			.toBeInTheDocument();
	});

	it('lot déjà sous rappel → aucun nouveau rappel possible', async () => {
		renderPanel('surveillance');
		await expect.element(page.getByText('Rappel en cours')).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Déclencher le rappel' }).all()).toHaveLength(0);
	});

	/**
	 * ⚠️ #59 — depuis la fiche, le présentateur ne pouvait pas voir les enseignes : seul un
	 * compteur s'affichait, et le lot filtré hors du sélecteur de /rappels-produits.
	 */
	it('après un rappel, liste les magasins touchés sur la fiche elle-même', async () => {
		renderPanel('surveillance', {
			recall: {
				blockedBatchesCount: 2,
				impactedBatchIds: ['lot-1', 'lot-2'],
				depthSaturated: false,
				affectedShipments: [
					{
						shipmentId: 'ship-1',
						shipmentRef: 'EXP-42',
						customerId: 'c-1',
						customerName: 'Monoprix Bastille',
						dateEnvoi: '2026-07-10T08:00:00.000Z',
						statutLivraison: 'EN_COURS',
						transporteur: 'Stef',
						batchIds: ['lot-1']
					}
				]
			}
		});

		await expect.element(page.getByText('Monoprix Bastille')).toBeInTheDocument();
		await expect.element(page.getByText(/EXP-42/)).toBeInTheDocument();
		expect(page.getByText('Rappel en cours').all()).toHaveLength(0);
	});
});

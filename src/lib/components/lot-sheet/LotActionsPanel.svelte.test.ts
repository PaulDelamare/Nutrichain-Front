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

	/**
	 * Les DEUX canaux, côte à côte. Un lot bloqué peut l'être par une excursion de température ou
	 * par un contrôle non conforme, et les deux n'exigent pas la même preuve : l'un demande que
	 * l'incident froid soit traité, l'autre une contre-analyse conforme. N'en proposer qu'un
	 * laissait sans issue les lots retenus par l'autre.
	 */
	it('lot en quarantaine → propose les deux levées, froid et qualité', async () => {
		renderPanel('quarantaine');
		await expect
			.element(page.getByRole('button', { name: 'Lever la quarantaine froid' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Lever la quarantaine qualité' }))
			.toBeInTheDocument();
	});

	/** Chaque bouton poste sur SON action : les confondre libérerait un lot par le mauvais canal. */
	it('chaque levée poste sur son action serveur', async () => {
		renderPanel('quarantaine');
		const actions = Array.from(document.querySelectorAll('form[action]')).map((f) =>
			f.getAttribute('action')
		);
		expect(actions).toContain('?/release');
		expect(actions).toContain('?/qualityRelease');
	});

	/**
	 * LA confirmation que personne ne voyait : elle vivait dans le bloc conditionne au statut, or
	 * une levee reussie change precisement ce statut. Le bloc disparaissait avec son message, et
	 * l utilisateur ne savait pas si son geste avait abouti.
	 */
	it('affiche la confirmation de levée alors que le lot a QUITTÉ la quarantaine', async () => {
		renderPanel('conforme', { qualityReleased: true, statutRestaure: 'EN_ATTENTE_QC' });
		await expect.element(page.getByText(/Quarantaine qualité levée/)).toBeInTheDocument();
		await expect.element(page.getByText(/EN_ATTENTE_QC/)).toBeInTheDocument();
	});

	it('affiche la confirmation de levée froid après le changement de statut', async () => {
		renderPanel('conforme', { released: true });
		await expect.element(page.getByText(/Quarantaine froid levée/)).toBeInTheDocument();
	});

	it('un lot en quarantaine ne propose PAS de déclencher un rappel', async () => {
		renderPanel('quarantaine');
		expect(page.getByRole('button', { name: 'Déclencher le rappel' }).all()).toHaveLength(0);
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

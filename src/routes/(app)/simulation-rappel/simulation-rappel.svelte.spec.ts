import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import SimulationPage from './+page.svelte';

const shipment = {
	shipmentId: 'ship-1',
	shipmentRef: 'EXP-2026-0042',
	customerName: 'Supermarché Central',
	dateEnvoi: '2026-07-31T17:04:57.375Z',
	statutLivraison: 'LIVRE',
	dateLivraison: '2026-08-01T17:04:57.390Z',
	transporteur: 'TransFroid Express',
	batchIds: ['lot-2']
};

const downstream = [
	{ id: 'lot-2', lotNumber: '260801-9XVI3T', produit: 'Beurre', statut: 'EN_STOCK' },
	{ id: 'lot-3', lotNumber: '260801-0HX5TL', produit: 'Beurre', statut: 'BLOQUE' }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPage(form: any) {
	render(SimulationPage, {
		props: {
			data: { lots: [{ id: 'lot-1', label: '260801-SOURCE — Lait cru' }] },
			form
		}
	} as unknown as SvelteComponentOptions<typeof SimulationPage>);
}

const simulated = {
	simulated: true,
	sourceLotId: 'lot-1',
	impactedCount: 3,
	affectedShipments: [shipment],
	affectedShipmentsCount: 1,
	affectedShipmentsTruncated: false,
	depthSaturated: false,
	downstreamPartial: false,
	downstream
};

describe('écran de simulation de rappel', () => {
	/**
	 * #79 — L'écran s'arrêtait à un compteur de lots. Voir QUELS magasins ont reçu la marchandise
	 * n'était possible qu'après un rappel réel, irréversible, sur une page qui annonce
	 * « Lecture seule ».
	 */
	it('nomme les magasins touchés', async () => {
		renderPage(simulated);

		await expect.element(page.getByText('Supermarché Central')).toBeInTheDocument();
		await expect.element(page.getByText(/EXP-2026-0042/)).toBeInTheDocument();
	});

	it('le dit franchement quand aucune expédition n’est partie', async () => {
		renderPage({ ...simulated, affectedShipments: [], affectedShipmentsCount: 0 });

		await expect
			.element(page.getByText('Aucune expédition déjà partie ne contient ces lots.'))
			.toBeInTheDocument();
	});

	/**
	 * L'écran affichait `downstream.length + 1`, alors que le rappel réel compte déjà le lot source :
	 * il annonçait un lot de plus que le rappel qu'il estime. Le compte de l'API (3) et le calcul
	 * fautif (2 descendants + 1 = 3) coïncideraient ici — d'où un impact volontairement DIFFÉRENT du
	 * nombre de descendants, sans quoi l'assertion serait vraie quel que soit le calcul.
	 */
	it('affiche le compte de lots rendu par l’API, pas la longueur de la liste + 1', async () => {
		renderPage({ ...simulated, impactedCount: 7 });

		await expect.element(page.getByText('7')).toBeInTheDocument();
	});
});

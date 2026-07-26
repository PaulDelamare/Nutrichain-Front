import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import RecallResult from './RecallResult.svelte';
import type { ApiRecallResult } from '$lib/Api/traceability.server';

const shipment = {
	shipmentId: 'ship-1',
	shipmentRef: 'EXP-2026-0042',
	customerId: 'c-1',
	customerName: 'Carrefour Market Lyon',
	dateEnvoi: '2026-07-10T08:00:00.000Z',
	statutLivraison: 'LIVRE',
	transporteur: 'Chronofroid',
	batchIds: ['lot-1', 'lot-2']
};

function renderResult(partial: Partial<ApiRecallResult> = {}) {
	const recall: ApiRecallResult = {
		blockedBatchesCount: 3,
		impactedBatchIds: ['lot-1', 'lot-2', 'lot-3'],
		affectedShipments: [shipment],
		depthSaturated: false,
		...partial
	};

	render(RecallResult, {
		props: { recall }
	} as unknown as SvelteComponentOptions<typeof RecallResult>);
}

describe('RecallResult', () => {
	/**
	 * ⚠️ Cœur de #59. Un chiffre nu (« 2 expéditions ») ne dit pas QUELS magasins sont touchés —
	 * or c'est la dernière étape du parcours soutenance depuis la fiche lot.
	 */
	it('nomme chaque magasin touché, pas seulement le nombre d’expéditions', async () => {
		renderResult();

		await expect.element(page.getByText('Carrefour Market Lyon')).toBeInTheDocument();
		await expect.element(page.getByText(/EXP-2026-0042/)).toBeInTheDocument();
		await expect.element(page.getByText(/Chronofroid/)).toBeInTheDocument();
		await expect.element(page.getByText(/LIVRE/)).toBeInTheDocument();
	});

	it('résume le nombre de lots et d’expéditions', async () => {
		renderResult();

		await expect
			.element(page.getByText('✅ Rappel exécuté — 3 lots bloqués · 1 expédition impactée'))
			.toBeInTheDocument();
	});

	it('signale une descendance potentiellement incomplète', async () => {
		renderResult({ depthSaturated: true, affectedShipments: [] });

		await expect.element(page.getByText(/profondeur de graphe saturée/)).toBeInTheDocument();
	});

	it('dit clairement quand aucune expédition n’est encore partie', async () => {
		renderResult({ affectedShipments: [], blockedBatchesCount: 1 });

		await expect
			.element(page.getByText('Aucune expédition déjà partie ne contient ces lots.'))
			.toBeInTheDocument();
	});
});

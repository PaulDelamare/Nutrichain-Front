import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import Page from './(app)/palettes/+page.svelte';
import type { ApiLogisticUnit } from '$lib/Api/logistics.server';

const LOT = {
	id: 'lot-1',
	numero_lot: '260729-AAAAAA',
	produit: 'Beurre doux',
	gtin: '3401234567890',
	unite: 'kg',
	statut: 'EN_STOCK',
	date_peremption: null
};

function palette(overrides: Partial<ApiLogisticUnit> = {}): ApiLogisticUnit {
	return {
		id: 'palette-1',
		sscc: '034567890000000606',
		source: 'INTERNE',
		created_at: '2026-07-30T10:00:00.000Z',
		contient_lot_rappele: false,
		id_materiel: null,
		positions_divergentes: false,
		ouverture: null,
		lots: [{ ...LOT, quantite: 30 }],
		dernier_contenu: [],
		...overrides
	};
}

function afficher(unite: ApiLogisticUnit) {
	render(Page, {
		props: {
			data: {
				saisie: unite.sscc,
				resultat: { etat: 'trouvee', palette: unite, emplacement: null }
			}
		}
	} as unknown as SvelteComponentOptions<typeof Page>);
}

describe('/palettes — palette intacte', () => {
	it('propose l’impression de l’étiquette', async () => {
		afficher(palette());

		await expect.element(page.getByText('Imprimer l’étiquette')).toBeInTheDocument();
	});
});

describe('/palettes — palette ouverte', () => {
	const ouverte = () =>
		palette({
			ouverture: { date: '2026-07-31T08:00:00.000Z' },
			lots: [],
			dernier_contenu: [{ ...LOT, quantite_a_l_ouverture: 30 }]
		});

	it('annonce l’ouverture au lieu de la faire passer pour une palette vide', async () => {
		afficher(ouverte());

		await expect.element(page.getByText(/ouverte le 31\/07\/2026/)).toBeInTheDocument();
		// Le message d'une palette jamais remplie ne doit PAS apparaître : il enverrait l'opérateur
		// la remplir alors que le contenant n'existe plus.
		await expect
			.element(page.getByText('Cette palette ne porte plus aucun lot.'))
			.not.toBeInTheDocument();
	});

	it('n’offre plus l’impression d’étiquette, que l’API refuse en 409', async () => {
		afficher(ouverte());

		await expect.element(page.getByText('Imprimer l’étiquette')).not.toBeInTheDocument();
	});

	/**
	 * Le point sanitaire : la marchandise peut être encore posée sur la palette. Sans cette trace,
	 * scanner l'étiquette au quai répondrait « rien à signaler » sur un lot passé sous rappel.
	 */
	it('montre le dernier contenu connu, en le nommant comme une trace', async () => {
		afficher(ouverte());

		await expect
			.element(page.getByText('Dernier contenu connu, à l’ouverture'))
			.toBeInTheDocument();
		await expect.element(page.getByText('260729-AAAAAA')).toBeInTheDocument();
		await expect.element(page.getByText('Quantité à l’ouverture')).toBeInTheDocument();
	});

	it('relaie l’alerte de rappel portée par cette trace', async () => {
		afficher(
			palette({
				ouverture: { date: '2026-07-31T08:00:00.000Z' },
				lots: [],
				contient_lot_rappele: true,
				dernier_contenu: [{ ...LOT, statut: 'ALERTE', quantite_a_l_ouverture: 30 }]
			})
		);

		await expect
			.element(page.getByText(/Cette palette porte un lot sous rappel/))
			.toBeInTheDocument();
	});
});

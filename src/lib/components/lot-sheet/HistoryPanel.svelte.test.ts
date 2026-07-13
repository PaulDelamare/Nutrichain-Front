import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import HistoryPanel from './HistoryPanel.svelte';
import type { LotEvent } from '$lib/types/lot-sheet';

function event(n: number, tone: LotEvent['tone'] = 'ok'): LotEvent {
	return { time: '10:0' + (n % 10), day: '11/07/2026', title: `Étape ${n}`, detail: '', tone };
}

function renderPanel(events: LotEvent[]) {
	render(HistoryPanel, {
		props: { events }
	} as unknown as SvelteComponentOptions<typeof HistoryPanel>);
}

describe('HistoryPanel', () => {
	it('annonce l’absence d’historique au lieu de laisser un vide', async () => {
		renderPanel([]);

		await expect.element(page.getByText(/Aucune étape enregistrée/)).toBeInTheDocument();
	});

	it('n’affiche que les étapes récentes quand l’historique est long', async () => {
		renderPanel(Array.from({ length: 8 }, (_, i) => event(i + 1)));

		await expect.element(page.getByText('Étape 5')).toBeInTheDocument();
		await expect.element(page.getByText('Étape 6')).not.toBeInTheDocument();
		await expect.element(page.getByText('Voir les 3 étapes précédentes')).toBeInTheDocument();
	});

	it('déroule le reste de l’historique à la demande', async () => {
		renderPanel(Array.from({ length: 8 }, (_, i) => event(i + 1)));

		await page.getByText('Voir les 3 étapes précédentes').click();

		await expect.element(page.getByText('Étape 8')).toBeInTheDocument();
		await expect.element(page.getByText('Réduire l’historique')).toBeInTheDocument();
	});

	it('ne propose pas de dérouler quand tout tient déjà à l’écran', async () => {
		renderPanel([event(1), event(2)]);

		await expect.element(page.getByText(/Voir les/)).not.toBeInTheDocument();
	});
});

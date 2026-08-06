import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import PublicTraceQr from './PublicTraceQr.svelte';
import type { LotStatus } from '$lib/types/lot';

function renderQr(lotId: string, statut: LotStatus) {
	render(PublicTraceQr, { props: { lotId, statut } } as unknown as SvelteComponentOptions<
		typeof PublicTraceQr
	>);
}

describe('PublicTraceQr — QR de tracabilite publique (client final)', () => {
	// Le PNG est deja servi par /fiche-lot/[lotId]/label, qui encode le GS1 Digital Link.
	// On verifie le cablage de la source, pas juste la presence d'une image.
	it("pointe le QR vers l'etiquette Digital Link du lot", async () => {
		renderQr('lot-123', 'conforme');

		const img = page.getByRole('img', { name: /traçabilité publique/i });
		await expect.element(img).toBeInTheDocument();
		await expect.element(img).toHaveAttribute('src', '/fiche-lot/lot-123/label');
	});

	// La fiche publique n'expose qu'un lot commercialise (EXPEDIE) ou sous rappel : un QR scanne
	// sur un lot encore en stock renvoie 404. On previent, plutot que de laisser croire a un bug.
	it("previent que la fiche publique n'est active qu'une fois le lot expedie", async () => {
		renderQr('lot-123', 'conforme');

		await expect.element(page.getByText(/une fois le lot expédié/i)).toBeInTheDocument();
	});

	it("n'affiche pas cet avertissement pour un lot deja expedie", async () => {
		renderQr('lot-9', 'expedie');

		await expect.element(page.getByText(/une fois le lot expédié/i)).not.toBeInTheDocument();
	});
});

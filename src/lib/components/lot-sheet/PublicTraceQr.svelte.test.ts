import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import PublicTraceQr from './PublicTraceQr.svelte';

describe('PublicTraceQr — QR de tracabilite publique (client final)', () => {
	// Le PNG est deja servi par /fiche-lot/[lotId]/label, qui encode le GS1 Digital Link.
	// On verifie le cablage de la source, pas juste la presence d'une image.
	it("pointe le QR vers l'etiquette Digital Link du lot", async () => {
		render(PublicTraceQr, { props: { lotId: 'lot-123' } } as unknown as SvelteComponentOptions<
			typeof PublicTraceQr
		>);

		const img = page.getByRole('img', { name: /traçabilité publique/i });
		await expect.element(img).toBeInTheDocument();
		await expect.element(img).toHaveAttribute('src', '/fiche-lot/lot-123/label');
	});
});

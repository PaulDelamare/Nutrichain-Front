import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import LotLocationMap from './LotLocationMap.svelte';
import type { LotMapPin } from '$lib/types/lot-map';

function renderMap(pin: LotMapPin | null) {
	render(LotLocationMap, { props: { pin, lotId: 'lot-1' } } as unknown as SvelteComponentOptions<
		typeof LotLocationMap
	>);
}

describe('LotLocationMap', () => {
	/**
	 * ⚠️ #23 : la carte affichait toujours un repère — déduit du nom du site, ou posé au centre de la
	 * France — sous une bannière « données en direct depuis la base ». Sans position saisie, on ne
	 * dessine plus rien et on dit où la renseigner.
	 */
	it('dit où saisir la position au lieu d’afficher un repère inventé', async () => {
		renderMap(null);

		await expect.element(page.getByText('Emplacement non positionné')).toBeInTheDocument();
		await expect.element(page.getByText(/Configuration/)).toBeInTheDocument();
	});

	it('ne parle plus de « position approximative » : un repère affiché est un repère réel', async () => {
		renderMap({ lat: 48.83318, lng: 2.28691, label: 'Chambre froide A', sublabel: 'Groupe 1' });

		await expect.element(page.getByRole('application')).toBeInTheDocument();
		expect(document.body.textContent).not.toMatch(/approximative/i);
	});
});

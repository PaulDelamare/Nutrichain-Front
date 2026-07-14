import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import QuarantinePanel from './QuarantinePanel.svelte';
import type { KnownRole } from '$lib/config/roles';

const LOTS = [{ lot: 'LOT-A', detail: 'Beurre — bloque' }];

function renderPanel(role: KnownRole) {
	render(QuarantinePanel, {
		props: { lots: LOTS, role }
	} as unknown as SvelteComponentOptions<typeof QuarantinePanel>);
}

describe('QuarantinePanel — séparation des tâches HACCP', () => {
	it("refuse la levée à l'opérateur — il réceptionne, il ne valide pas sa marchandise", async () => {
		renderPanel('operator');

		await expect.element(page.getByText(/décision qualité/i)).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Lever la quarantaine' }).all()).toHaveLength(0);
	});

	it("laisse l'opérateur VOIR les lots bloqués", async () => {
		renderPanel('operator');

		await expect.element(page.getByText('LOT-A')).toBeInTheDocument();
	});

	it('autorise la levée au rôle qualité', async () => {
		renderPanel('quality');

		await expect
			.element(page.getByRole('button', { name: 'Lever la quarantaine' }))
			.toBeInTheDocument();
		expect(page.getByText(/décision qualité/i).all()).toHaveLength(0);
	});

	it('refuse la levée au lecteur', async () => {
		renderPanel('viewer');

		expect(page.getByRole('button', { name: 'Lever la quarantaine' }).all()).toHaveLength(0);
	});

	it("n'ampute rien quand le rôle est inconnu", async () => {
		renderPanel(undefined);

		await expect
			.element(page.getByRole('button', { name: 'Lever la quarantaine' }))
			.toBeInTheDocument();
	});
});

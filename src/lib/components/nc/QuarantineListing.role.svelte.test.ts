import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import QuarantineListing from './QuarantineListing.svelte';
import type { KnownRole } from '$lib/config/roles';

const ROWS = [
	{ id: 'a26b8f1f-f569-44be-b907-9a6d45b5a00b', numero: 'LOT-A', detail: 'Beurre — Quarantaine' }
];

function renderListing(role: KnownRole, props: Record<string, unknown> = {}) {
	render(QuarantineListing, {
		props: { rows: ROWS, role, ...props }
	} as unknown as SvelteComponentOptions<typeof QuarantineListing>);
}

describe('QuarantineListing — séparation des tâches HACCP', () => {
	it("refuse la levée à l'opérateur — il réceptionne, il ne valide pas sa marchandise", async () => {
		renderListing('operator');

		await expect.element(page.getByText(/décision qualité/i)).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Lever la quarantaine' }).all()).toHaveLength(0);
	});

	it("laisse l'opérateur VOIR les lots bloqués", async () => {
		renderListing('operator');

		await expect.element(page.getByText('LOT-A')).toBeInTheDocument();
	});

	it('autorise la levée au rôle qualité', async () => {
		renderListing('quality');

		await expect
			.element(page.getByRole('button', { name: 'Lever la quarantaine' }))
			.toBeInTheDocument();
		expect(page.getByText(/décision qualité/i).all()).toHaveLength(0);
	});

	it('refuse la levée au lecteur', async () => {
		renderListing('viewer');

		expect(page.getByRole('button', { name: 'Lever la quarantaine' }).all()).toHaveLength(0);
	});

	it("n'ampute rien quand le rôle est inconnu", async () => {
		renderListing(undefined);

		await expect
			.element(page.getByRole('button', { name: 'Lever la quarantaine' }))
			.toBeInTheDocument();
	});

	it('ouvre la modale via le rappel onlever, avec le lot cliqué', async () => {
		const onlever = vi.fn();
		renderListing('quality', { onlever });

		await page.getByRole('button', { name: 'Lever la quarantaine' }).click();

		expect(onlever).toHaveBeenCalledWith(ROWS[0]);
	});
});

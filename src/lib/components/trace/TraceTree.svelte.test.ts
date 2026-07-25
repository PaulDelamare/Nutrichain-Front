import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import TraceTree from './TraceTree.svelte';
import TraceStep from './TraceStep.svelte';
import type { TraceStep as Step } from '$lib/types/trace';

function etape(partial: Partial<Step> = {}): Step {
	return {
		phase: 'Lot parent',
		title: 'Lait cru — 260709-000112',
		detail: 'Statut EN_STOCK',
		icon: 'amont',
		...partial
	};
}

const renderTree = (steps: Step[]) =>
	render(TraceTree, { props: { steps } } as unknown as SvelteComponentOptions<typeof TraceTree>);

const renderStep = (step: Step) =>
	render(TraceStep, { props: step } as unknown as SvelteComponentOptions<typeof TraceStep>);

describe('TraceTree', () => {
	it('n’affiche aucune étape quand la généalogie est vide', async () => {
		renderTree([]);
		await expect.element(page.getByText('Lot parent')).not.toBeInTheDocument();
	});

	it('déroule la chaîne dans l’ordre reçu', async () => {
		renderTree([
			etape({ title: 'Lait cru — 260709-000112' }),
			etape({ title: 'Lait pasteurisé — 260711-000201', icon: 'transform' })
		]);

		await expect.element(page.getByText('Lait cru — 260709-000112')).toBeInTheDocument();
		await expect.element(page.getByText('Lait pasteurisé — 260711-000201')).toBeInTheDocument();
	});
});

describe('TraceStep', () => {
	it('donne la phase, le lot et son statut', async () => {
		renderStep(etape());
		await expect.element(page.getByText('Lot parent')).toBeInTheDocument();
		await expect.element(page.getByText('Lait cru — 260709-000112')).toBeInTheDocument();
		await expect.element(page.getByText('Statut EN_STOCK')).toBeInTheDocument();
	});

	it('se passe de détail quand l’API n’en fournit pas', async () => {
		renderStep(etape({ detail: undefined }));
		await expect.element(page.getByText('Statut EN_STOCK')).not.toBeInTheDocument();
	});

	it('met en évidence le lot analysé par un badge', async () => {
		renderStep(
			etape({
				icon: 'transform',
				detail: undefined,
				badge: { label: 'EN_STOCK', variant: 'green' }
			})
		);
		await expect.element(page.getByText('EN_STOCK')).toBeInTheDocument();
	});

	it('accepte les trois natures d’étape du graphe', async () => {
		renderStep(etape({ icon: 'aval', title: 'Lot issu — 260712-000310' }));
		await expect.element(page.getByText('Lot issu — 260712-000310')).toBeInTheDocument();
	});
});

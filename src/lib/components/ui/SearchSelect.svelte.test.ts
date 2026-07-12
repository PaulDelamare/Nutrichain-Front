import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import SearchSelect from './SearchSelect.svelte';

const OPTIONS = [
	{ value: 'lot-a', label: 'Beurre — LOT-A' },
	{ value: 'lot-b', label: 'Lait — LOT-B' },
	{ value: 'lot-c', label: 'Crème — LOT-C' }
];

function renderSelect(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	render(SearchSelect, {
		props: { name: 'lot', options: OPTIONS, placeholder: '— choisir un lot —', onchange, ...props }
	} as unknown as SvelteComponentOptions<typeof SearchSelect>);
	return { onchange };
}

describe('SearchSelect', () => {
	it('affiche le placeholder tant que rien n’est sélectionné', async () => {
		renderSelect();
		await expect.element(page.getByText('— choisir un lot —')).toBeInTheDocument();
	});

	it('ouvre la liste et filtre les options à la saisie', async () => {
		renderSelect();
		await page.getByRole('button', { name: '— choisir un lot —' }).click();

		const filtre = page.getByPlaceholder('Taper pour filtrer…');
		await expect.element(filtre).toBeInTheDocument();

		await filtre.fill('lait');
		await expect.element(page.getByRole('option', { name: 'Lait — LOT-B' })).toBeInTheDocument();
		expect(page.getByRole('option').all()).toHaveLength(1);
	});

	it('sélectionne une option, affiche son libellé et notifie onchange', async () => {
		const { onchange } = renderSelect();
		await page.getByRole('button', { name: '— choisir un lot —' }).click();
		await page.getByRole('option', { name: 'Crème — LOT-C' }).click();

		expect(onchange).toHaveBeenCalledWith('lot-c');
		await expect.element(page.getByText('Crème — LOT-C')).toBeInTheDocument();
	});
});

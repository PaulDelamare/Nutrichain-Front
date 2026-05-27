import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './(app)/tableau-de-bord/+page.svelte';

describe('/tableau-de-bord', () => {
	it('affiche le titre de section', async () => {
		render(Page);

		const heading = page.getByRole('heading', { level: 2, name: 'Vue d\'ensemble' });
		await expect.element(heading).toBeInTheDocument();
	});
});

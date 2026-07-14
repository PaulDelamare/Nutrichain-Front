import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import ImportCsv from './ImportCsv.svelte';
import type { ImportReport } from '$lib/Api/connectors.server';

const noop = () => async () => {};

function renderImport(over: { report?: ImportReport | null; error?: string | null } = {}) {
	render(ImportCsv, {
		props: {
			action: '?/importProducts',
			columns: 'nom, code_gtin',
			report: over.report ?? null,
			error: over.error ?? null,
			envoi: false,
			pendant: noop
		}
	} as unknown as SvelteComponentOptions<typeof ImportCsv>);
}

describe('ImportCsv — import et rapport', () => {
	it('affiche le bouton d’import et les colonnes attendues', async () => {
		renderImport();
		await expect.element(page.getByRole('button', { name: 'Importer' })).toBeInTheDocument();
		await expect.element(page.getByText(/Colonnes attendues/)).toBeInTheDocument();
	});

	it('résume le rapport et liste les lignes en erreur', async () => {
		renderImport({
			report: {
				total: 3,
				created: 2,
				updated: 0,
				errors: 1,
				results: [{ line: 3, status: 'error', message: 'code_gtin: format invalide' }]
			}
		});

		await expect
			.element(page.getByText(/2 créé\(s\), 0 mis à jour, 1 en erreur/))
			.toBeInTheDocument();
		await expect
			.element(page.getByText(/Ligne 3 : code_gtin: format invalide/))
			.toBeInTheDocument();
	});

	it('affiche l’erreur d’import quand la requête échoue', async () => {
		renderImport({ error: 'Corps CSV vide ou Content-Type non text/csv.' });
		await expect.element(page.getByText(/Corps CSV vide/)).toBeInTheDocument();
	});
});

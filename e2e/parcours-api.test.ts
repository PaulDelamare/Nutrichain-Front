import { expect, test, type Page } from '@playwright/test';

const API_MODE = process.env.E2E_API === '1';
const EMAIL = process.env.E2E_EMAIL ?? 'first.admin@nutrichain.local';
const PASSWORD = process.env.E2E_PASSWORD ?? 'NutriChain!2026';

test.skip(!API_MODE, 'Nécessite l’API NutriChain démarrée (E2E_API=1)');

async function login(page: Page) {
	await page.goto('/connexion');
	await page.waitForLoadState('networkidle');
	await page.fill('input[name="email"]', EMAIL);
	await page.fill('input[name="password"]', PASSWORD);
	await page.click('button[type="submit"]');
	await page.waitForURL('**/tableau-de-bord', { timeout: 15000 });
}

test('connexion puis tableau de bord sur données API réelles', async ({ page }) => {
	await login(page);
	await expect(page.getByRole('heading', { level: 2, name: "Vue d'ensemble" })).toBeVisible();
	await expect(page.getByText('valeurs de démonstration')).toHaveCount(0);
});

test('chaque écran métier sert des données API (aucune bannière mock)', async ({ page }) => {
	await login(page);

	const screens = [
		'/utilisateurs',
		'/chaine-du-froid',
		'/non-conformites',
		'/rappels-produits',
		'/recherche-lots',
		'/tracabilite',
		'/portail-magasins',
		'/integrations',
		'/audit-logs'
	];

	for (const path of screens) {
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		await expect(
			page.getByText(/démonstration|API indisponible/),
			`mock détecté sur ${path}`
		).toHaveCount(0);
	}
});

test('la liste des utilisateurs contient le compte connecté', async ({ page }) => {
	await login(page);
	await page.goto('/utilisateurs');
	await expect(page.getByText(EMAIL)).toBeVisible();
});

test('le formulaire de rappel liste des lots rappelables', async ({ page }) => {
	await login(page);
	await page.goto('/rappels-produits');
	const options = page.locator('select[name="lotId"] option');
	expect(await options.count()).toBeGreaterThan(1);
});

test('la traçabilité ciblée sur un lot affiche sa généalogie', async ({ page }) => {
	await login(page);

	await page.goto('/rappels-produits');
	const lotId = await page
		.locator('select[name="lotId"] option:not([disabled])')
		.first()
		.getAttribute('value');
	expect(lotId).toBeTruthy();

	await page.goto(`/tracabilite?lot=${lotId}`);
	await page.waitForLoadState('networkidle');
	await expect(page.getByText('Lot sélectionné')).toBeVisible();
});

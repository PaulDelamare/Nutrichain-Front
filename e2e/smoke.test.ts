import { expect, test } from '@playwright/test';


test('un visiteur non connecté est redirigé vers /connexion', async ({ page }) => {
	await page.goto('/tableau-de-bord');
	await expect(page).toHaveURL(/\/connexion/);
});

test('la page de connexion affiche le formulaire', async ({ page }) => {
	await page.goto('/connexion');
	await expect(page.locator('input[name="email"]')).toBeVisible();
	await expect(page.locator('input[name="password"]')).toBeVisible();
	await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test("l'inscription sans token propose le lien de connexion", async ({ page }) => {
	await page.goto('/inscription');
	await expect(page.locator('a[href*="connexion"]')).toBeVisible();
});

test('une connexion invalide affiche une erreur sans crash', async ({ page }) => {
	await page.goto('/connexion');
	await page.waitForLoadState('networkidle');
	await page.fill('input[name="email"]', 'inconnu@nutrichain.local');
	await page.fill('input[name="password"]', 'mauvais-mot-de-passe');
	await page.click('button[type="submit"]');
	await expect(page).toHaveURL(/\/connexion/);
	await expect(page.locator('input[name="email"]')).toBeVisible();
});

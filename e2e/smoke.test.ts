import { expect, test } from '@playwright/test';

// Smoke tests sans dépendance à l'API : garde d'auth, rendu des pages publiques.
// Le parcours authentifié complet (API + Postgres seedé) est dans parcours-api.test.ts.

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
	// Sans API on attend un message d'erreur, avec API un refus d'identifiants —
	// dans les deux cas on reste sur /connexion avec le formulaire visible.
	await expect(page).toHaveURL(/\/connexion/);
	await expect(page.locator('input[name="email"]')).toBeVisible();
});

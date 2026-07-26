import { expect, test, type Page } from '@playwright/test';

const API_MODE = process.env.E2E_API === '1';
const EN_CI = process.env.CI === 'true' || process.env.CI === '1';

/**
 * `first.admin@nutrichain.local` était le défaut : ce compte N'EXISTE PAS. Le seed de l'API n'en
 * fait qu'une invitation `pending` (prisma/seed.ts) — aucune ligne `Account`, donc aucun mot de
 * passe, donc aucune connexion possible. Le parcours n'aurait pas pu passer même avec l'API
 * démarrée ; personne ne s'en était aperçu puisqu'il était systématiquement sauté (#61).
 * Le seul owner connectable du seed est `admin@nutrichain.local`.
 */
const EMAIL = process.env.E2E_EMAIL ?? 'admin@nutrichain.local';
const PASSWORD = process.env.E2E_PASSWORD ?? 'NutriChain!2026';

/**
 * En local, sauter ce parcours quand aucune API ne tourne est un confort légitime.
 * En CI, c'est le défaut corrigé par #61 : le job « e2e » restait vert en permanence tout en ne
 * jouant que les smoke tests, et annonçait une garantie qu'il n'apportait pas. Un run CI qui
 * n'expose pas d'API doit désormais rougir au lieu de mentir.
 */
if (EN_CI && !API_MODE) {
	throw new Error(
		"Le parcours API ne peut pas être sauté en CI : le job doit démarrer l'API NutriChain et " +
			'poser E2E_API=1. Si un job ne joue volontairement que les smoke tests, il doit exclure ' +
			'ce fichier (--ignore-snapshots / --grep-invert), pas le sauter en silence.'
	);
}

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

/**
 * Le sélecteur de lot n'est plus un `<select>` natif : #58 l'a remplacé par le composant
 * `SearchSelect`, qui rend un `<input type="hidden" name="lotId">` doublé d'un combobox accessible
 * (bouton `aria-haspopup="listbox"` + `role="option"`). Les deux tests ci-dessous visaient encore
 * `select[name="lotId"] option` — une dérive restée invisible tant que le parcours était sauté.
 * On s'accroche au contrat accessible et au nom du champ, pas à une classe CSS.
 */
const DECLENCHEUR_LOT =
	'div:has(> input[type="hidden"][name="lotId"]) > button[aria-haspopup="listbox"]';

test('le formulaire de rappel liste des lots rappelables', async ({ page }) => {
	await login(page);
	await page.goto('/rappels-produits');

	await page.locator(DECLENCHEUR_LOT).click();
	expect(await page.getByRole('option').count()).toBeGreaterThan(0);
});

test('la traçabilité ciblée sur un lot affiche sa généalogie', async ({ page }) => {
	await login(page);

	await page.goto('/rappels-produits');
	await page.locator(DECLENCHEUR_LOT).click();
	await page.getByRole('option').first().click();

	const lotId = await page.locator('input[name="lotId"]').inputValue();
	expect(lotId).toBeTruthy();

	await page.goto(`/tracabilite?lot=${lotId}`);
	await page.waitForLoadState('networkidle');

	// « Lot sélectionné » n'existe plus dans le code : la vue rend `TraceGenealogy`, dont la bande
	// centrale « Lot analysé » est le seul élément inconditionnel dès qu'un graphe est construit.
	// L'assertion négative empêche qu'une généalogie en erreur repasse pour un succès.
	// `.first()` : le libellé apparaît deux fois quand le graphe est rendu (la bande centrale et la
	// carte du lot analysé). Sa présence suffit ; en compter les occurrences figerait la maquette.
	await expect(page.getByText('Lot analysé').first()).toBeVisible();
	await expect(page.getByText('Impossible de charger la généalogie')).toHaveCount(0);
});

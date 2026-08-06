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

/**
 * Le formulaire de déclenchement d'un rappel est maintenant dans une modale, ouverte par un bouton ;
 * son contenu (dont le champ lot) n'est monté qu'à l'ouverture.
 *
 * La page est rendue côté serveur PUIS hydratée : un clic qui arrive avant que Svelte n'ait attaché
 * le gestionnaire est purement perdu (rien ne s'ouvre), et rallonger le timeout n'y change rien —
 * le clic, lui, est déjà passé. On réessaie donc le clic jusqu'à ce que la modale apparaisse : dès
 * l'hydratation faite, la première tentative suivante ouvre la modale. `exact` pour ne pas viser le
 * bouton de soumission « Déclencher le rappel ». (Le compte de test est owner : il a le droit de
 * décision qualité, donc le bouton s'affiche.)
 */
async function ouvrirDeclencheur(page: Page): Promise<void> {
	const champLot = page.locator(DECLENCHEUR_LOT);
	const bouton = page.getByRole('button', { name: 'Déclencher un rappel', exact: true });
	await expect(async () => {
		// Une fois la modale ouverte, NE PAS recliquer : le bouton est sous le fond de la modale, et
		// un second clic tomberait sur ce fond (donc la refermerait). On ne clique que tant qu'elle
		// est fermée — ce qui, avant hydratation, ne fait rien, d'où la reprise.
		if (!(await champLot.isVisible())) await bouton.click();
		await expect(champLot).toBeVisible({ timeout: 2000 });
	}).toPass({ timeout: 20_000 });
}

test('le formulaire de rappel liste des lots rappelables', async ({ page }) => {
	await login(page);
	await page.goto('/rappels-produits');

	// Le déclenchement d'un rappel vit désormais dans une modale : l'ouvrir avant de viser le champ lot.
	await ouvrirDeclencheur(page);
	await page.locator(DECLENCHEUR_LOT).click();
	expect(await page.getByRole('option').count()).toBeGreaterThan(0);
});

test('la traçabilité ciblée sur un lot affiche sa généalogie', async ({ page }) => {
	await login(page);

	await page.goto('/rappels-produits');
	await ouvrirDeclencheur(page);
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

test('la fiche lot affiche un QR de traçabilité publique qui charge vraiment', async ({ page }) => {
	await login(page);

	// Récupère un lotId réel par le même chemin que le parcours de rappel.
	await page.goto('/rappels-produits');
	await ouvrirDeclencheur(page);
	await page.locator(DECLENCHEUR_LOT).click();
	await page.getByRole('option').first().click();
	const lotId = await page.locator('input[name="lotId"]').inputValue();
	expect(lotId).toBeTruthy();

	await page.goto(`/fiche-lot/${lotId}`);
	await page.waitForLoadState('networkidle');

	const qr = page.getByRole('img', { name: /traçabilité publique/i });
	await expect(qr).toBeVisible();
	await expect(qr).toHaveAttribute('src', new RegExp(`/fiche-lot/${lotId}/label$`));

	// Preuve de bout en bout : le PNG est RÉELLEMENT servi (front -> /label -> API -> QR),
	// pas une balise <img> avec une src morte. `complete && naturalWidth > 0` = image décodée.
	await expect
		.poll(async () => qr.evaluate((el) => (el as HTMLImageElement).naturalWidth > 0), {
			timeout: 10_000
		})
		.toBe(true);
});

test('le bouton « Simuler un incident » crée une vraie alerte chaîne du froid', async ({
	page
}) => {
	await login(page);
	await page.goto('/chaine-du-froid');
	await page.waitForLoadState('networkidle');

	await page.getByRole('button', { name: /simuler un incident/i }).click();
	await page.waitForLoadState('networkidle');

	// Le message porte une donnée RÉELLE (nombre de lots mis en quarantaine par l'API) : le voir
	// prouve que toute la chaîne a tourné — front -> API -> détection -> alerte + quarantaine.
	await expect(page.getByText(/incident simulé/i)).toBeVisible();
	// Et la page n'est plus vide : une alerte froid est désormais active.
	await expect(page.getByText(/aucune alerte de chaîne du froid active/i)).toHaveCount(0);

	await page.screenshot({
		path: 'C:/Users/paulo/AppData/Local/Temp/claude/D--CodeCours-4e-Fil-Rouge-application-Nutrichain-Api/cd76d894-e521-4ed4-9fff-fc7a1a5a3270/scratchpad/chaine-froid-simulee.png',
		fullPage: true
	});
});

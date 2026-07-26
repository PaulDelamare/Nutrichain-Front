import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	},
	testDir: 'e2e',
	// Un job e2e qui échoue sans laisser de preuve oblige à rejouer le scénario à l'aveugle.
	// En CI on archive donc un rapport HTML et la trace des tests tombés (DOM, réseau, captures).
	// Pas de `retries` : une reprise automatique masquerait justement l'instabilité qu'on cherche.
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: { trace: 'retain-on-failure' }
});

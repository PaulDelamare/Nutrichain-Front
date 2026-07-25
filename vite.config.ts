import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],

	test: {
		expect: { requireAssertions: true },

		coverage: {
			provider: 'v8',
			// `json-summary` alimente le récapitulatif publié par la CI : le seuil ne sert à rien
			// si personne ne voit le chiffre.
			reporter: ['text', 'html', 'lcov', 'json-summary'],
			include: ['src/**/*.{ts,svelte}'],
			// Exclus du périmètre : fichiers sans logique testable unitairement (déclarations de
			// types, index d'alias vide, bootstrap) et routes SvelteKit, couvertes par les tests
			// de `+page.server.ts` et par Playwright. La logique métier reste intégralement mesurée.
			exclude: [
				'src/**/*.{test,spec}.{js,ts}',
				'src/**/*.d.ts',
				'src/hooks.*.ts',
				'src/routes/**',
				'src/lib/index.ts',
				'src/lib/types/**',
				'src/lib/Models/**'
			],
			thresholds: {
				lines: 70,
				functions: 70,
				branches: 70,
				statements: 70
			}
		},

		projects: [
			{
				extends: './vite.config.ts',

				test: {
					name: 'client',

					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},

					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});

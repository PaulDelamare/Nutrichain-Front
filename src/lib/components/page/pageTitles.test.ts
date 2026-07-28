import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

/**
 * #81 — Aucune page ne renseignait `document.title` : l'onglet du navigateur n'affichait rien
 * d'exploitable, et rien n'empêchait la prochaine page de naître muette elle aussi.
 *
 * Deux façons légitimes de se nommer :
 *  - passer par `PageHead`, qui compose le titre depuis l'intitulé déjà affiché à l'écran ;
 *  - déclarer son propre `<title>`, pour les écrans hors application (connexion, scan public…)
 *    qui n'ont pas d'en-tête de page.
 *
 * Ce test échoue sur toute page qui ne fait ni l'un ni l'autre.
 */
describe('chaque page se nomme dans l’onglet du navigateur (#81)', () => {
	const racine = path.join(process.cwd(), 'src', 'routes');

	const pages = (dossier: string): string[] =>
		readdirSync(dossier).flatMap((entree) => {
			const chemin = path.join(dossier, entree);
			if (statSync(chemin).isDirectory()) return pages(chemin);
			return entree === '+page.svelte' ? [chemin] : [];
		});

	it('aucune page ne reste sans titre', () => {
		const muettes = pages(racine)
			.filter((chemin) => {
				const source = readFileSync(chemin, 'utf-8');
				return !source.includes('<PageHead') && !/<title>/.test(source);
			})
			.map((chemin) => path.relative(process.cwd(), chemin));

		expect(muettes).toEqual([]);
	});
});

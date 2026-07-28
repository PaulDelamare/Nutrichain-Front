import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

/**
 * #82 — Le front refiltrait `is_active` sur des listes que l'API a DÉJÀ filtrées, en lisant un champ
 * qu'elle ne lui envoie pas hors administration. `undefined` étant faux, le sélecteur Fournisseur de
 * l'écran Réception et le sélecteur Client de l'écran Expédition étaient VIDES pour tout rôle
 * terrain — les deux formulaires inutilisables, sans le moindre message d'erreur.
 *
 * Le défaut restait invisible parce que le jeu de démonstration connecte un `owner` : il obtient la
 * projection complète, donc le champ, donc une liste pleine. C'est le piège que `GUIDE_IA.md`
 * décrit — tester avec le rôle le plus faible, pas avec l'admin.
 *
 * La règle : la liste des archivés se demande à l'API (`?includeArchived=true`), elle ne se
 * reconstitue pas à l'arrivée. Seul l'écran de configuration, qui la demande explicitement pour
 * pouvoir réactiver, a une raison de trier sur ce champ.
 */
describe('le front ne refiltre pas les archives que l’API a déjà écartées (#82)', () => {
	const AUTORISE = path.join('src', 'routes', '(app)', 'configuration');

	const fichiers = (dossier: string): string[] =>
		readdirSync(dossier).flatMap((entree) => {
			const chemin = path.join(dossier, entree);
			if (statSync(chemin).isDirectory()) return fichiers(chemin);
			return /\.(ts|svelte)$/.test(chemin) && !chemin.includes('.test.') ? [chemin] : [];
		});

	it('aucun écran hors configuration ne trie sur is_active', () => {
		const fautifs: string[] = [];

		for (const chemin of fichiers(path.join(process.cwd(), 'src', 'routes'))) {
			const relatif = path.relative(process.cwd(), chemin);
			if (relatif.startsWith(AUTORISE)) continue;

			readFileSync(chemin, 'utf-8')
				.split('\n')
				.forEach((ligne, index) => {
					// Pas de `[^)]*` ici : la parenthèse fermante du paramètre de la lambda
					// (`.filter((s) => s.is_active)`) arrêterait la recherche avant le champ.
					if (/\.(filter|some|every|find)\(.*is_active/.test(ligne)) {
						fautifs.push(`${relatif}:${index + 1}`);
					}
				});
		}

		expect(fautifs).toEqual([]);
	});
});

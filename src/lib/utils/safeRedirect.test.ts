import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { safeRedirect } from './safeRedirect';

const DEFAUT = '/tableau-de-bord';

/**
 * `safeRedirect` est une primitive de SÉCURITÉ — c'est elle qui décide si l'utilisateur reste sur
 * NutriChain ou part ailleurs — et elle n'avait aucun test direct : elle n'était exercée
 * qu'indirectement, à travers la page de connexion. Une primitive de cette nature mérite ses
 * propres cas, y compris ceux qui la contournent classiquement.
 */
describe('safeRedirect', () => {
	it('laisse passer un chemin interne', () => {
		expect(safeRedirect('/rappels-produits', DEFAUT)).toBe('/rappels-produits');
		expect(safeRedirect('/fiche-lot/abc?onglet=trace', DEFAUT)).toBe('/fiche-lot/abc?onglet=trace');
	});

	it('retombe sur le défaut quand rien n’est demandé', () => {
		expect(safeRedirect(null, DEFAUT)).toBe(DEFAUT);
		expect(safeRedirect(undefined, DEFAUT)).toBe(DEFAUT);
		expect(safeRedirect('', DEFAUT)).toBe(DEFAUT);
	});

	it('refuse une URL absolue vers un autre domaine', () => {
		expect(safeRedirect('https://exemple-malveillant.tld', DEFAUT)).toBe(DEFAUT);
		expect(safeRedirect('http://exemple-malveillant.tld/connexion', DEFAUT)).toBe(DEFAUT);
	});

	it('refuse une URL protocol-relative', () => {
		// `//evil.tld` n'est pas un chemin : le navigateur y lit un domaine, avec le schéma courant.
		expect(safeRedirect('//exemple-malveillant.tld', DEFAUT)).toBe(DEFAUT);
	});

	it('refuse un schéma exotique', () => {
		expect(safeRedirect('javascript:alert(1)', DEFAUT)).toBe(DEFAUT);
		expect(safeRedirect('data:text/html,<script>alert(1)</script>', DEFAUT)).toBe(DEFAUT);
	});

	it('n’est pas trompée par des espaces autour de la valeur', () => {
		expect(safeRedirect('  https://exemple-malveillant.tld  ', DEFAUT)).toBe(DEFAUT);
		expect(safeRedirect('  /utilisateurs  ', DEFAUT)).toBe('/utilisateurs');
	});
});

/**
 * #77 — Le défaut n'était pas l'absence de garde : `safeRedirect` existait, était correcte et était
 * utilisée par la page de connexion. Elle avait simplement été OUBLIÉE sur une des deux portes, et
 * la porte oubliée était la plus sensible — juste après la validation du second facteur.
 *
 * Ce test relit les fichiers serveur et échoue si une lecture de `?redirect` n'est pas assainie.
 * C'est la seule façon d'empêcher qu'une troisième porte réintroduise le trou.
 */
describe('toute lecture de ?redirect est assainie (#77)', () => {
	it('aucune redirection ne consomme le paramètre brut', () => {
		const racine = path.join(process.cwd(), 'src', 'routes');
		const fichiers: string[] = [];

		const parcourir = (dossier: string) => {
			for (const entree of readdirSync(dossier)) {
				const chemin = path.join(dossier, entree);
				if (statSync(chemin).isDirectory()) parcourir(chemin);
				else if (chemin.endsWith('.ts') && !chemin.includes('.test.')) fichiers.push(chemin);
			}
		};
		parcourir(racine);
		expect(fichiers.length).toBeGreaterThan(0);

		const nonAssainies: string[] = [];

		for (const fichier of fichiers) {
			const source = readFileSync(fichier, 'utf-8');
			source.split('\n').forEach((ligne, index) => {
				const litLeParametre = /searchParams\.get\(\s*['"`]redirect['"`]\s*\)/.test(ligne);
				if (!litLeParametre) return;
				// La lecture doit être enveloppée par `safeRedirect` sur la MÊME ligne : c'est la forme
				// qu'emploient les deux appels du dépôt, et la seule vérifiable par lecture.
				if (!/safeRedirect\s*\(/.test(ligne)) {
					nonAssainies.push(`${path.relative(process.cwd(), fichier)}:${index + 1}`);
				}
			});
		}

		expect(nonAssainies).toEqual([]);
	});
});

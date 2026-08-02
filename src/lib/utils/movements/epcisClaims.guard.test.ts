import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * #83 — Le front revendiquait EPCIS à trois endroits qui n'affichent aucun événement EPCIS : le
 * titre du panneau d'activité récente, le sous-titre du graphe de flux, et la description de la
 * fiche lot. Les trois sont alimentés par `Batch_Mouvement`, l'historique interne. GS1/EPCIS est
 * l'argument central du projet : nommer une conformité que le back n'a pas transforme une lacune
 * assumée en affirmation fausse.
 *
 * Ce garde-fou interdit le mot à l'écran PARTOUT, sauf là où de vrais événements sont affichés.
 *
 * ## Ce qu'il ne prouve PAS
 *
 * Il lit du texte : c'est une aide à la relecture, pas une garantie. Il ne voit ni une chaîne
 * construite par concaténation, ni un libellé venu de l'API, ni une périphrase (« norme GS1 des
 * événements ») qui affirmerait la même chose sans le mot.
 */

const SRC = path.resolve(__dirname, '../../..');

/**
 * Écrans et modules qui ont le DROIT de nommer EPCIS, parce qu'ils montrent ou exportent les
 * événements réellement émis par l'API (`ObjectEvent`, `TransformationEvent`, `AggregationEvent`).
 */
const AUTORISES = [
	// Le journal : il liste les événements réellement émis, avec leur type.
	path.join('routes', '(app)', 'journal-epcis'),
	// L'export CSV et l'écran qui le propose : c'est ce même journal qui part dans le fichier.
	path.join('routes', '(app)', 'export-epcis'),
	path.join('routes', '(app)', 'integrations'),
	// Entrées de menu vers les deux écrans ci-dessus, et signature de bas de page.
	path.join('lib', 'config', 'nav.ts'),
	path.join('lib', 'config', 'app.ts'),
	// Contrats d'API : ces types décrivent la vraie ressource `EPCIS_Event`.
	path.join('lib', 'Api', 'traceability.server.ts'),
	path.join('lib', 'Api', 'connectors.server.ts')
];

function collecte(dir: string, out: string[] = []): string[] {
	for (const entree of readdirSync(dir)) {
		if (entree === 'node_modules') continue;
		const complet = path.join(dir, entree);
		if (statSync(complet).isDirectory()) collecte(complet, out);
		else if (/\.(svelte|ts)$/.test(entree)) out.push(complet);
	}
	return out;
}

describe('revendication EPCIS à l’écran (#83)', () => {
	// Les fichiers de test parlent du mot pour l'interdire : les inclure ferait rougir le garde-fou
	// sur lui-même.
	const fichiers = collecte(SRC).filter(
		(f) =>
			!AUTORISES.some((autorise) => f.includes(autorise)) &&
			!/\.(test|spec)\.ts$/.test(f) &&
			!/\.svelte\.(test|spec)\.ts$/.test(f)
	);

	it('balaie bien toute l’arborescence du front', () => {
		expect(fichiers.length).toBeGreaterThan(100);
		expect(fichiers.some((f) => f.endsWith('.svelte'))).toBe(true);
	});

	it('aucun écran ne nomme EPCIS en dehors de ceux qui affichent de vrais événements', () => {
		const violations: string[] = [];

		for (const fichier of fichiers) {
			const lignes = readFileSync(fichier, 'utf8').split('\n');
			lignes.forEach((ligne, index) => {
				// Un commentaire explique, il n'affiche rien : c'est même là qu'on documente POURQUOI
				// l'écran ne revendique pas EPCIS.
				const nue = ligne.trim();
				const commentaire =
					nue.startsWith('//') ||
					nue.startsWith('*') ||
					nue.startsWith('/*') ||
					nue.startsWith('<!--') ||
					// Ligne intermédiaire ou finale d'un commentaire HTML multi-ligne.
					nue.endsWith('-->');
				if (commentaire) return;
				if (!/EPCIS/i.test(ligne)) return;

				violations.push(`${path.relative(SRC, fichier)}:${index + 1} — ${nue.slice(0, 100)}`);
			});
		}

		expect(violations, `\n${violations.join('\n')}\n`).toEqual([]);
	});
});

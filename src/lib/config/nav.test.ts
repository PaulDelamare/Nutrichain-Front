import { describe, it, expect } from 'vitest';
import { navPourRole, navGroups, headerTitle, findNavItem } from './nav';

const liens = (role: Parameters<typeof navPourRole>[0]) =>
	navPourRole(role).flatMap((g) => g.items.map((i) => i.href));

describe('navigation selon le rôle', () => {
	it("masque au lecteur les pages dont l'API lui refuse la donnée", () => {
		const vues = liens('viewer');

		expect(vues).not.toContain('/utilisateurs');
		expect(vues).not.toContain('/audit-logs');
		expect(vues).not.toContain('/integrations');
	});

	it('laisse au lecteur tout le métier — masquer une écriture ne doit pas masquer une lecture', () => {
		const vues = liens('viewer');

		expect(vues).toContain('/tableau-de-bord');
		expect(vues).toContain('/chaine-du-froid');
		expect(vues).toContain('/non-conformites');
		expect(vues).toContain('/rappels-produits');
		expect(vues).toContain('/tracabilite');
		expect(vues).toContain('/portail-magasins');
	});

	it("masque les mêmes pages à l'opérateur et à la qualité", () => {
		for (const role of ['operator', 'quality'] as const) {
			expect(liens(role)).not.toContain('/utilisateurs');
			expect(liens(role)).not.toContain('/audit-logs');
		}
	});

	it("ne masque rien à l'administrateur ni au propriétaire", () => {
		const attendus = navGroups.flatMap((g) => g.items.map((i) => i.href));

		expect(liens('admin')).toEqual(attendus);
		expect(liens('owner')).toEqual(attendus);
	});

	// Le pire cas : l'API ne renvoie pas encore le rôle. Masquer amputerait l'application
	// de son propriétaire. On préfère un lien qui mène à un refus lisible.
	it("n'ampute rien quand le rôle est inconnu (API sans le champ)", () => {
		expect(liens(undefined)).toEqual(navGroups.flatMap((g) => g.items.map((i) => i.href)));
	});

	it('masque tout le réservé quand le rôle est explicitement nul', () => {
		expect(liens(null)).not.toContain('/utilisateurs');
		expect(liens(null)).toContain('/tableau-de-bord');
	});

	it('ne laisse aucun groupe vide', () => {
		for (const role of ['viewer', 'operator', 'quality', 'admin'] as const) {
			expect(navPourRole(role).every((g) => g.items.length > 0)).toBe(true);
		}
	});

	// Le titre de page est calculé sur la nav COMPLÈTE : une page masquée reste titrée
	// correctement si on y accède par URL directe.
	it("garde le titre d'une page masquée", () => {
		expect(headerTitle('/audit-logs')).toBe('Audit & logs');
		expect(findNavItem('/utilisateurs')?.label).toBe('Utilisateurs');
	});
});

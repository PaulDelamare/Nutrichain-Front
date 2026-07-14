import { describe, it, expect } from 'vitest';
import { peutDeciderQualite, peutAdministrer, peutEcrire, estRole, roleLabel } from './roles';

describe('séparation des tâches HACCP', () => {
	it("exclut l'opérateur des décisions qualité — il ne valide pas sa propre marchandise", () => {
		expect(peutDeciderQualite('operator')).toBe(false);
		expect(peutEcrire('operator')).toBe(true);
	});

	it('autorise la qualité à décider, sans lui donner les droits d’écriture matière', () => {
		expect(peutDeciderQualite('quality')).toBe(true);
		expect(peutEcrire('quality')).toBe(false);
	});

	it('ne donne aucun droit au lecteur', () => {
		expect(peutDeciderQualite('viewer')).toBe(false);
		expect(peutEcrire('viewer')).toBe(false);
		expect(peutAdministrer('viewer')).toBe(false);
	});

	it("réserve l'administration au propriétaire et à l'administrateur", () => {
		expect(peutAdministrer('owner')).toBe(true);
		expect(peutAdministrer('admin')).toBe(true);
		expect(peutAdministrer('quality')).toBe(false);
	});
});

describe('rôle inconnu — le pire cas', () => {
	// Si le front part avant l'API qui expose le rôle, le champ est ABSENT. Masquer alors
	// verrouillerait l'application pour TOUT LE MONDE, owner compris. On n'ose rien masquer :
	// le 403 de l'API reste l'autorité.
	it("n'interdit RIEN quand l'API ne renvoie pas le champ (undefined)", () => {
		expect(peutDeciderQualite(undefined)).toBe(true);
		expect(peutAdministrer(undefined)).toBe(true);
		expect(peutEcrire(undefined)).toBe(true);
	});

	// null = l'API a répondu, et l'utilisateur n'a réellement aucun rôle exploitable.
	it('interdit tout quand le rôle est explicitement null', () => {
		expect(peutDeciderQualite(null)).toBe(false);
		expect(peutAdministrer(null)).toBe(false);
		expect(peutEcrire(null)).toBe(false);
	});
});

describe('validation du rôle reçu', () => {
	it('rejette un rôle hors référentiel — « member » est le défaut Prisma, pas un rôle', () => {
		expect(estRole('member')).toBe(false);
		expect(estRole('OWNER')).toBe(false);
		expect(estRole('')).toBe(false);
		expect(estRole(null)).toBe(false);
		expect(estRole('quality')).toBe(true);
	});

	it('affiche un libellé lisible, jamais le code brut', () => {
		expect(roleLabel('quality')).toBe('Qualité');
		expect(roleLabel(null)).toBe('Membre');
	});
});

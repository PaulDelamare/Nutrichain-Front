import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { exigerAdministrateur, refusAdministration, refusDecisionQualite } from './guards';
import type { SessionUser } from '$lib/types/session';
import type { KnownRole } from '$lib/config/roles';

const utilisateur = (role: KnownRole): SessionUser => ({
	id: 'u1',
	name: 'Test',
	email: 't@x.fr',
	role,
	isPlatformAdmin: false
});

const refusDe = (fn: () => void) => {
	try {
		fn();
		return null;
	} catch (e) {
		return isHttpError(e) ? e.status : 'exception inattendue';
	}
};

describe('exigerAdministrateur — garde de PAGE', () => {
	it.each(['viewer', 'operator', 'quality'] as const)('refuse le rôle %s en 403', (role) => {
		expect(refusDe(() => exigerAdministrateur(utilisateur(role), 'Le journal'))).toBe(403);
	});

	it.each(['owner', 'admin'] as const)('laisse passer le rôle %s', (role) => {
		expect(refusDe(() => exigerAdministrateur(utilisateur(role), 'Le journal'))).toBeNull();
	});

	it('refuse une session sans utilisateur', () => {
		expect(refusDe(() => exigerAdministrateur(undefined, 'Le journal'))).toBe(403);
	});

	it("laisse passer quand le rôle est inconnu — le 403 de l'API reste l'autorité", () => {
		expect(refusDe(() => exigerAdministrateur(utilisateur(undefined), 'Le journal'))).toBeNull();
	});

	it('refuse un rôle explicitement nul', () => {
		expect(refusDe(() => exigerAdministrateur(utilisateur(null), 'Le journal'))).toBe(403);
	});
});

describe('refusDecisionQualite — garde d’ACTION', () => {
	it("refuse l'opérateur avec un message affichable", () => {
		const refus = refusDecisionQualite(utilisateur('operator'));

		expect(refus).toMatch(/décision qualité/i);
	});

	it.each(['owner', 'admin', 'quality'] as const)('laisse passer le rôle %s', (role) => {
		expect(refusDecisionQualite(utilisateur(role))).toBeNull();
	});

	it.each(['viewer', 'operator'] as const)('refuse le rôle %s', (role) => {
		expect(refusDecisionQualite(utilisateur(role))).not.toBeNull();
	});

	it('ne refuse rien quand le rôle est inconnu', () => {
		expect(refusDecisionQualite(utilisateur(undefined))).toBeNull();
	});
});

describe('refusAdministration — garde d’ACTION', () => {
	it.each(['owner', 'admin'] as const)('laisse passer le rôle %s', (role) => {
		expect(refusAdministration(utilisateur(role))).toBeNull();
	});

	it.each(['quality', 'operator', 'viewer'] as const)('refuse le rôle %s', (role) => {
		expect(refusAdministration(utilisateur(role))).not.toBeNull();
	});
});

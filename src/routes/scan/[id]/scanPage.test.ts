import { describe, expect, it } from 'vitest';
import type { PublicScanData } from '$lib/Api/public.server';

/** Projection affichée sur /scan/[id] — isolée pour verrouiller le contrat B2C. */
function fermesAffichees(scan: PublicScanData): string[] {
	return (scan.trace.origines ?? []).map((o) => o.ferme);
}

describe('scan public — origines ferme', () => {
	it('liste les fermes renvoyées par l’API', () => {
		const scan = {
			lot: {
				date_peremption: null,
				nom_produit: 'Yaourt',
				gtin: '123',
				producteur: 'Laiterie',
				statut_sanitaire: 'CONFORME' as const
			},
			trace: {
				etapes: 1,
				message: 'tracé',
				etapes_details: [],
				origines: [{ ferme: 'Ferme Les Aubépines' }]
			}
		};
		expect(fermesAffichees(scan)).toEqual(['Ferme Les Aubépines']);
	});

	it('reste vide si l’API n’a pas encore le champ (déploiement décalé)', () => {
		const scan = {
			lot: {
				date_peremption: null,
				nom_produit: 'Yaourt',
				gtin: '123',
				producteur: 'Laiterie',
				statut_sanitaire: 'CONFORME' as const
			},
			trace: { etapes: 0, message: 'tracé', etapes_details: [] }
		};
		expect(fermesAffichees(scan)).toEqual([]);
	});
});

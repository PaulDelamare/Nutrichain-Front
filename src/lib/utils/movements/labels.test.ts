import { describe, it, expect } from 'vitest';
import {
	normalizeMovementType,
	movementLabel,
	MOVEMENT_CHART_TYPES,
	MOVEMENT_CHART_LABELS,
	MOVEMENT_CHART_COLORS,
	MOVEMENT_LABELS
} from './labels';
import { LOT_EVENT_TITLES } from '$lib/utils/lots/lotEvents';

describe('normalizeMovementType', () => {
	it('regroupe les réceptions, y compris celles issues de la synchro mobile', () => {
		expect(normalizeMovementType('RECEPTION')).toBe('RECEPTION');
		expect(normalizeMovementType('CREATE_RECEIPT_VIA_SYNC_RECEPTION')).toBe('RECEPTION');
	});

	it('reconnaît une expédition', () => {
		expect(normalizeMovementType('EXPEDITION')).toBe('EXPEDITION');
	});

	it("range l'arrivée constatée à part, sans la confondre avec l'expédition ni avec « Autres »", () => {
		expect(normalizeMovementType('LIVRAISON')).toBe('LIVRAISON');
	});

	it('range la quarantaine froid avec les quarantaines', () => {
		expect(normalizeMovementType('QUARANTAINE_FROID')).toBe('QUARANTAINE');
		expect(normalizeMovementType('quarantaine')).toBe('QUARANTAINE');
	});

	it('regroupe entrée et sortie de transformation', () => {
		expect(normalizeMovementType('TRANSFORMATION_ENTREE')).toBe('TRANSFORMATION');
		expect(normalizeMovementType('TRANSFORM_CONSUME')).toBe('TRANSFORMATION');
		expect(normalizeMovementType('TRANSFORM_CREATE')).toBe('TRANSFORMATION');
	});

	it('classe en « Autres » un type que le front ne connaît pas, plutôt que de planter', () => {
		expect(normalizeMovementType('TYPE_INCONNU_DE_L_API')).toBe('AUTRE');
	});
});

describe('libellés et couleurs du graphe', () => {
	it('chaque catégorie du graphe a un libellé et une couleur — sinon la légende est trouée', () => {
		for (const type of MOVEMENT_CHART_TYPES) {
			expect(MOVEMENT_CHART_LABELS[type]).toBeTruthy();
			expect(MOVEMENT_CHART_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});
});

describe('movementLabel', () => {
	/**
	 * #83 — Ces libellés décrivent des `Batch_Mouvement`, l'historique INTERNE d'un lot. Les
	 * affubler d'un type d'événement EPCIS affirme une conformite que le back n'a pas : l'API n'a
	 * jamais emis de `TransactionEvent`, et rien n'est emis du tout pour la quarantaine, le rappel,
	 * le controle qualite, le deplacement ou le rebut. La vue normalisee, c'est le journal EPCIS.
	 */
	const VOCABULAIRE_EPCIS = [
		'objectevent',
		'transactionevent',
		'transformationevent',
		'aggregationevent',
		'epcis'
	];

	/** Insensible à la casse ET aux accents : « Événement Objet » doit tomber comme « ObjectEvent ». */
	const aplati = (texte: string) => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

	it("ne nomme aucun type d'événement EPCIS, y compris sur un type inconnu", () => {
		// Les DEUX registres de libellés de mouvement : celui du tableau de bord et celui de la frise
		// de la fiche lot. `lotEvents` est propre aujourd'hui, et rien ne l'empêcherait de dériver
		// demain — or c'est la moitié de la surface décrite par #83.
		const libelles = [
			...Object.values(MOVEMENT_LABELS),
			...Object.values(LOT_EVENT_TITLES),
			movementLabel('TYPE_QUE_L_API_AJOUTERAIT')
		];

		for (const libelle of libelles) {
			for (const terme of VOCABULAIRE_EPCIS) {
				expect(
					aplati(libelle),
					`« ${libelle} » revendique « ${terme} », que rien n'émet`
				).not.toContain(terme);
			}
		}
	});

	it('nomme le geste métier, en clair', () => {
		expect(movementLabel('EXPEDITION')).toBe('Expédition');
		expect(movementLabel('RAPPEL')).toBe('Rappel produit');
	});

	it('rend lisible un type que le front ne connaît pas, sans rien inventer', () => {
		expect(movementLabel('AUDIT_MANUEL')).toBe('Mouvement — AUDIT_MANUEL');
	});

	/**
	 * #81 — Le repli générique est une roue de secours, pas une traduction : il recrache le code de
	 * l'API tel quel. Deux types réels y tombaient (`DEPLACEMENT`, `MISE_AU_REBUT`), et le tableau
	 * de bord affichait « ObjectEvent — DEPLACEMENT » dans l'activité récente.
	 *
	 * La liste est celle de l'API (`logistics.constants.ts` → `MOVEMENT_TYPES`), recopiée ici faute
	 * de dépôt commun : ce test échoue le jour où l'API en ajoute un et qu'on l'oublie ici.
	 */
	it('traduit chaque type de mouvement émis par l’API (#81)', () => {
		const TYPES_API = [
			'RECEPTION',
			'CONTROLE_QUALITE',
			'TRANSFORMATION_ENTREE',
			'TRANSFORMATION_SORTIE',
			'EXPEDITION',
			'QUARANTAINE_FROID',
			'LEVEE_QUARANTAINE',
			'LEVEE_QUARANTAINE_QUALITE',
			'RAPPEL',
			'DEPLACEMENT',
			'MISE_AU_REBUT',
			'LIVRAISON'
		];

		for (const type of TYPES_API) {
			expect(movementLabel(type), `type ${type} non traduit`).not.toContain(type);
		}
	});
});

import type { ApiBatchMouvement } from '$lib/Api/traceability.server';
import type { LotEvent, LotEventTone } from '$lib/types/lot-sheet';

type EventShape = {
	title: string;
	tone: LotEventTone | ((meta: Record<string, unknown>) => LotEventTone);
	context: (meta: Record<string, unknown>) => string;
};

function str(meta: Record<string, unknown>, key: string): string {
	const v = meta[key];
	return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
}

const SHAPES: Record<string, EventShape> = {
	RECEPTION: {
		title: 'Réception',
		tone: (m) => (m.quarantaine === true ? 'warn' : 'ok'),
		context: (m) => {
			const controle = str(m, 'statut_controle');
			const bloque = m.quarantaine === true ? ' — lot placé en quarantaine' : '';
			return controle ? `Contrôle à réception : ${controle}${bloque}` : '';
		}
	},
	CONTROLE_QUALITE: {
		title: 'Contrôle qualité',
		tone: (m) => (m.resultat === 'NON_CONFORME' ? 'warn' : 'ok'),
		context: (m) => {
			const resultat = str(m, 'resultat') === 'NON_CONFORME' ? 'Non conforme' : 'Conforme';
			const test = str(m, 'type_test');
			const suite =
				m.statut_resultant === 'EN_STOCK'
					? ' — lot libéré'
					: m.statut_resultant === 'BLOQUE'
						? ' — lot placé en quarantaine'
						: '';
			return [test && `${test} : ${resultat}${suite}`].filter(Boolean).join(' · ');
		}
	},
	TRANSFORMATION_ENTREE: {
		title: 'Transformation — production',
		tone: 'ok',
		context: () => ''
	},
	TRANSFORMATION_SORTIE: {
		title: 'Transformation — consommation',
		tone: 'ok',
		context: () => ''
	},
	EXPEDITION: {
		title: 'Expédition',
		tone: 'neutral',
		context: () => ''
	},
	QUARANTAINE_FROID: {
		title: 'Quarantaine — excursion de température',
		tone: 'warn',
		context: (m) => {
			const pic = str(m, 'peakTemp');
			const seuil = str(m, 'threshold');
			const capteur = str(m, 'sensorId');
			const temp = pic && seuil ? `Pic ${pic} °C (seuil ${seuil} °C)` : '';
			return [temp, capteur && `capteur ${capteur}`].filter(Boolean).join(' · ');
		}
	},
	LEVEE_QUARANTAINE: {
		title: 'Levée de quarantaine',
		tone: 'ok',
		context: (m) => {
			const motif = str(m, 'motif');
			return motif ? `Motif : ${motif}` : '';
		}
	},
	RAPPEL: {
		title: 'Rappel produit',
		tone: 'danger',
		context: (m) => {
			const motif = str(m, 'motif');
			return motif ? `Motif : ${motif}` : '';
		}
	},
	DEPLACEMENT: {
		title: 'Déplacement',
		tone: 'neutral',
		context: (m) => {
			const from = str(m, 'from');
			const to = str(m, 'to');
			if (from && to) return `De ${from} vers ${to}`;
			if (to) return `Vers ${to}`;
			return '';
		}
	},
	LIVRAISON: {
		title: 'Livraison confirmée',
		tone: 'neutral',
		context: () => ''
	},
	RETRAIT_MAGASIN: {
		title: 'Retrait du rayon',
		tone: 'warn',
		context: (m) => {
			const constate = str(m, 'constate_aupres_de');
			const motif = str(m, 'motif');
			return [motif, constate && `constaté auprès de ${constate}`].filter(Boolean).join(' · ');
		}
	},
	MISE_AU_REBUT: {
		title: 'Mise au rebut',
		tone: 'danger',
		context: (m) => {
			const motif = str(m, 'motif');
			return motif ? `Motif : ${motif}` : '';
		}
	}
};

/**
 * Titres de la frise, exposés pour le garde-fou de #83 : aucun libellé de mouvement ne doit
 * revendiquer un type d'événement EPCIS, ni ici ni dans le registre du tableau de bord.
 */
export const LOT_EVENT_TITLES: Record<string, string> = Object.fromEntries(
	Object.entries(SHAPES).map(([type, shape]) => [type, shape.title])
);

function fallbackShape(typeAction: string): EventShape {
	return { title: typeAction, tone: 'neutral', context: () => '' };
}

export function movementsToLotEvents(movements: ApiBatchMouvement[]): LotEvent[] {
	return movements.map((m) => {
		const shape = SHAPES[m.type_action] ?? fallbackShape(m.type_action);
		const date = new Date(m.created_at);
		const meta = m.metadata ?? {};

		const parts = [
			shape.context(meta),
			`${m.quantite} ${m.unite}`,
			m.user?.name ? `par ${m.user.name}` : ''
		].filter(Boolean);

		return {
			time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
			day: date.toLocaleDateString('fr-FR'),
			title: shape.title,
			detail: parts.join(' · '),
			tone: typeof shape.tone === 'function' ? shape.tone(meta) : shape.tone
		};
	});
}

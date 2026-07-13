import type { ApiBatchMouvement } from '$lib/Api/traceability.server';
import type { LotEvent, LotEventTone } from '$lib/types/lot-sheet';

type EventShape = {
	title: string;
	/** La teinte peut dépendre du contexte réel : une réception non conforme n'est pas normale. */
	tone: LotEventTone | ((meta: Record<string, unknown>) => LotEventTone);
	/** Contexte lisible, tiré des métadonnées réelles de l'étape. Vide si l'API n'en fournit pas. */
	context: (meta: Record<string, unknown>) => string;
};

function str(meta: Record<string, unknown>, key: string): string {
	const v = meta[key];
	return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
}

// La couleur vient de la NATURE de l'étape, jamais d'un jugement.
// Quarantaine = bloquant mais réversible (orange). Rappel = irréversible (rouge).
const SHAPES: Record<string, EventShape> = {
	RECEPTION: {
		title: 'Réception',
		// Une réception non conforme place le lot en quarantaine dès son arrivée : elle ne doit
		// pas s'afficher comme une étape normale.
		tone: (m) => (m.quarantaine === true ? 'warn' : 'ok'),
		context: (m) => {
			const controle = str(m, 'statut_controle');
			const bloque = m.quarantaine === true ? ' — lot placé en quarantaine' : '';
			return controle ? `Contrôle à réception : ${controle}${bloque}` : '';
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
	}
};

/** Étape inconnue : on affiche le code brut plutôt que de le masquer, mais sans couleur. */
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

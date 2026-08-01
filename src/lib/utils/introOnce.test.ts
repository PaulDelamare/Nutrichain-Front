import { describe, it, expect } from 'vitest';
import { consumeIntroOnce } from './introOnce';

describe('consumeIntroOnce', () => {
	it('ne joue l’intro qu’une fois par clé côté client, mais toujours au rendu serveur', () => {
		// SSR : toujours vrai, et ne consomme rien (pas d'état partagé entre requêtes serveur).
		expect(consumeIntroOnce('vue-a', false)).toBe(true);
		expect(consumeIntroOnce('vue-a', false)).toBe(true);

		// Client : la première arrivée joue, les retours de navigation non.
		expect(consumeIntroOnce('vue-a', true)).toBe(true);
		expect(consumeIntroOnce('vue-a', true)).toBe(false);
		expect(consumeIntroOnce('vue-a', true)).toBe(false);

		// Une autre vue a sa propre intro.
		expect(consumeIntroOnce('vue-b', true)).toBe(true);
		expect(consumeIntroOnce('vue-b', true)).toBe(false);

		// Le SSR reste indépendant de l'état client déjà consommé.
		expect(consumeIntroOnce('vue-a', false)).toBe(true);
	});
});

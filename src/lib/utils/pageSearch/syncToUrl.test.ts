import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const goto = vi.fn();
vi.mock('$app/navigation', () => ({ goto: (...args: unknown[]) => goto(...args) }));

const { schedulePageSearchNavigation } = await import('./syncToUrl');

describe('schedulePageSearchNavigation', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		goto.mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('ne navigue pas quand la recherche n’a pas changé — sinon la page se recharge en boucle', () => {
		const params = new URLSearchParams('q=lait');
		schedulePageSearchNavigation('/recherche-lots', params, 'q', ' lait ');
		vi.runAllTimers();
		expect(goto).not.toHaveBeenCalled();
	});

	it('attend la fin de la frappe avant de naviguer (anti-rebond)', () => {
		schedulePageSearchNavigation('/recherche-lots', new URLSearchParams(), 'q', 'lait', 400);

		vi.advanceTimersByTime(399);
		expect(goto).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(goto).toHaveBeenCalledWith('/recherche-lots?q=lait', {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	});

	it('annule la navigation si l’appelant nettoie avant l’échéance', () => {
		const annuler = schedulePageSearchNavigation(
			'/recherche-lots',
			new URLSearchParams(),
			'q',
			'lait'
		);
		annuler();
		vi.runAllTimers();
		expect(goto).not.toHaveBeenCalled();
	});

	it('retire le paramètre quand la recherche est effacée, en gardant les autres filtres', () => {
		const params = new URLSearchParams('q=lait&statut=quarantaine');
		schedulePageSearchNavigation('/recherche-lots', params, 'q', '');
		vi.runAllTimers();
		expect(goto).toHaveBeenCalledWith('/recherche-lots?statut=quarantaine', expect.anything());
	});

	it('retombe sur le chemin nu quand plus aucun paramètre ne subsiste', () => {
		const params = new URLSearchParams('q=lait');
		schedulePageSearchNavigation('/recherche-lots', params, 'q', '');
		vi.runAllTimers();
		expect(goto).toHaveBeenCalledWith('/recherche-lots', expect.anything());
	});
});

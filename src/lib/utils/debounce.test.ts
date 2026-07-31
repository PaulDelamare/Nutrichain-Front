import { describe, it, expect, vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
	it('ne déclenche qu’une fois après le délai, même sur des appels rapprochés', () => {
		vi.useFakeTimers();
		try {
			const fn = vi.fn();
			const run = debounce(fn, 500);

			run();
			run();
			run();
			expect(fn).not.toHaveBeenCalled();

			vi.advanceTimersByTime(499);
			expect(fn).not.toHaveBeenCalled();

			vi.advanceTimersByTime(1);
			expect(fn).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it('transmet les derniers arguments reçus', () => {
		vi.useFakeTimers();
		try {
			const fn = vi.fn();
			const run = debounce(fn, 200);

			run('a');
			run('b');
			vi.advanceTimersByTime(200);

			expect(fn).toHaveBeenCalledExactlyOnceWith('b');
		} finally {
			vi.useRealTimers();
		}
	});

	it('cancel() annule un déclenchement en attente', () => {
		vi.useFakeTimers();
		try {
			const fn = vi.fn();
			const run = debounce(fn, 300);

			run();
			run.cancel();
			vi.advanceTimersByTime(1000);

			expect(fn).not.toHaveBeenCalled();
		} finally {
			vi.useRealTimers();
		}
	});
});

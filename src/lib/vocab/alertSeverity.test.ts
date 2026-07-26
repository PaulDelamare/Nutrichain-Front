import { describe, expect, it } from 'vitest';
import {
	alertSeverityColor,
	alertSeverityLabel,
	normalizeAlertSeverity,
	toColdAlertUiStatus
} from './alertSeverity';

describe('vocabulaire des gravités d’alerte', () => {
	it('regroupe PANIC avec CRITIQUE', () => {
		expect(normalizeAlertSeverity('PANIC')).toBe('CRITIQUE');
		expect(alertSeverityLabel('PANIC')).toBe('Critique');
		expect(alertSeverityColor('PANIC')).toBe('#ef4444');
	});

	it('affiche une excursion PANIC en critique sur la chaîne du froid', () => {
		expect(toColdAlertUiStatus('PANIC')).toBe('critique');
		expect(toColdAlertUiStatus('MOYENNE')).toBe('investigation');
	});
});

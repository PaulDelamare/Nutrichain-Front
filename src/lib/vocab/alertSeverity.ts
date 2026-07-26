/**
 * Gravités d’alerte côté API.
 * L’excursion thermique IoT écrit `PANIC` (`iotAlert.service`) — à regrouper avec `CRITIQUE`.
 */
export const ALERT_SEVERITIES = {
	CRITIQUE: 'CRITIQUE',
	PANIC: 'PANIC',
	HAUTE: 'HAUTE',
	MOYENNE: 'MOYENNE',
	FAIBLE: 'FAIBLE'
} as const;

/** Clé de regroupement pour les graphes (PANIC → CRITIQUE). */
export function normalizeAlertSeverity(niveau: string): string {
	const n = niveau.toUpperCase();
	if (n === ALERT_SEVERITIES.PANIC) return ALERT_SEVERITIES.CRITIQUE;
	return n;
}

export const ALERT_SEVERITY_LABELS: Record<string, string> = {
	CRITIQUE: 'Critique',
	HAUTE: 'Haute',
	MOYENNE: 'Moyenne',
	FAIBLE: 'Faible'
};

export const ALERT_SEVERITY_COLORS: Record<string, string> = {
	CRITIQUE: '#ef4444',
	HAUTE: '#f59e0b',
	MOYENNE: '#5aafa0',
	FAIBLE: '#94a3b8'
};

export function alertSeverityLabel(niveau: string): string {
	const key = normalizeAlertSeverity(niveau);
	return ALERT_SEVERITY_LABELS[key] ?? niveau;
}

export function alertSeverityColor(niveau: string): string {
	const key = normalizeAlertSeverity(niveau);
	return ALERT_SEVERITY_COLORS[key] ?? '#94a3b8';
}

/** Badge chaîne du froid : excursion / panic / haute → critique. */
export function toColdAlertUiStatus(niveau: string): 'critique' | 'investigation' {
	const n = niveau.toUpperCase();
	if (
		n === ALERT_SEVERITIES.CRITIQUE ||
		n === ALERT_SEVERITIES.PANIC ||
		n === ALERT_SEVERITIES.HAUTE
	) {
		return 'critique';
	}
	return 'investigation';
}

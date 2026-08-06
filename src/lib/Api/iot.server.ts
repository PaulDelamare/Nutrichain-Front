import type { Cookies } from '@sveltejs/kit';
import { api } from './client.server';

export type TelemetryPoint = {
	timestamp: string;
	temperature: number;
	humidity?: number;
	battery_level?: number;
};

export type TelemetryHistory = {
	sensor_id: string;
	points: number;
	data: TelemetryPoint[];
};

export function getSensorHistory(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	sensorId: string,
	limit = 48
) {
	return api(fetch, cookies).get<TelemetryHistory>(
		`/api/telemetry/${encodeURIComponent(sensorId)}/history?limit=${limit}`
	);
}

export type ColdIncidentSimulation = {
	equipmentId: string;
	sensorId: string;
	threshold: number;
	peakTemp: number;
	alertCreated: boolean;
	quarantinedCount: number;
};

/**
 * Déclenche une simulation d'incident chaîne du froid côté API : injecte une excursion puis rejoue
 * le vrai pipeline (alerte + quarantaine). Route protégée par clé API (checkApiKey) + session —
 * on garde donc l'`api()` par défaut, qui porte la clé.
 */
export function simulateColdChainIncident(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	equipmentId?: string
) {
	return api(fetch, cookies).post<ColdIncidentSimulation>(
		'/api/telemetry/simulate-incident',
		equipmentId ? { equipmentId } : {}
	);
}

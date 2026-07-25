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

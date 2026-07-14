import type { PageServerLoad } from './$types';
import { getAlerts, getEquipment, getQuarantineBatches } from '$lib/Api/organization.server';
import { getSensorHistory } from '$lib/Api/iot.server';
import { alertsToCold } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const sensorId = url.searchParams.get('sensor');

	const [alerts, equipment, quarantine] = await Promise.all([
		getAlerts(fetch, cookies),
		getEquipment(fetch, cookies),
		getQuarantineBatches(fetch, cookies)
	]);

	if (!alerts.ok || !equipment.ok) {
		return {
			incident: null,
			alerts: [],
			error: alerts.message || equipment.message,
			telemetry: null,
			selectedSensor: sensorId
		};
	}

	const { incident, rows } = alertsToCold(
		alerts.data,
		equipment.data,
		quarantine.ok ? quarantine.data : []
	);

	let telemetry: { sensorId: string; points: { timestamp: string; temperature: number }[]; threshold: number | null } | null =
		null;

	const targetSensor =
		sensorId ?? equipment.data.find((e) => e.sensor_id)?.sensor_id ?? null;

	if (targetSensor) {
		const history = await getSensorHistory(fetch, cookies, targetSensor, 48);
		if (history.ok) {
			const equip = equipment.data.find((e) => e.sensor_id === targetSensor);
			telemetry = {
				sensorId: targetSensor,
				points: history.data.data.map((p) => ({
					timestamp: p.timestamp,
					temperature: Number(p.temperature)
				})),
				threshold: equip?.temp_seuil_max != null ? Number(equip.temp_seuil_max) : null
			};
		}
	}

	return { incident, alerts: rows, error: null, telemetry, selectedSensor: targetSensor };
};

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAlertBatches, resolveAlert, type ApiAlertBatch } from '$lib/Api/alerts.server';
import { getAlerts, getEquipment } from '$lib/Api/organization.server';
import { getSensorHistory } from '$lib/Api/iot.server';
import { refusDecisionQualite } from '$lib/server/guards';
import { alertsToCold, listActiveColdAlerts } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const sensorId = url.searchParams.get('sensor');

	const [alerts, equipment] = await Promise.all([
		getAlerts(fetch, cookies),
		getEquipment(fetch, cookies)
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

	const cold = listActiveColdAlerts(alerts.data);
	const batchResponses = await Promise.all(cold.map((a) => getAlertBatches(fetch, cookies, a.id)));
	const batchesByAlertId = new Map<string, ApiAlertBatch[]>();
	cold.forEach((a, i) => {
		const res = batchResponses[i];
		// Échec → liste vide (jamais retomber sur quarantine-batches × frigo).
		batchesByAlertId.set(a.id, res.ok ? res.data : []);
	});

	const { incident, rows } = alertsToCold(alerts.data, equipment.data, batchesByAlertId);

	let telemetry: {
		sensorId: string;
		points: { timestamp: string; temperature: number }[];
		threshold: number | null;
	} | null = null;

	const targetSensor = sensorId ?? equipment.data.find((e) => e.sensor_id)?.sensor_id ?? null;

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

export const actions = {
	resolve: async ({ request, fetch, cookies, locals }) => {
		const refus = refusDecisionQualite(locals.user);
		if (refus) return fail(403, { resolveError: refus, alertId: '' });

		const fd = await request.formData();
		const alertId = String(fd.get('alertId') ?? '').trim();
		const note = String(fd.get('note') ?? '').trim();

		if (!alertId) {
			return fail(400, { resolveError: 'Alerte à clôturer manquante.', alertId: '' });
		}
		if (note.length < 3) {
			return fail(400, {
				resolveError: 'Motif de clôture requis (au moins 3 caractères).',
				alertId
			});
		}
		if (note.length > 500) {
			return fail(400, {
				resolveError: 'Motif trop long (500 caractères max).',
				alertId
			});
		}

		const res = await resolveAlert(fetch, cookies, alertId, note);
		if (!res.ok) return fail(res.status, { resolveError: res.message, alertId });
		return { resolved: true as const, alertId };
	}
} satisfies Actions;

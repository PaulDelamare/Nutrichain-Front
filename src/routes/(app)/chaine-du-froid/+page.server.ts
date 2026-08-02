import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAlertBatches, resolveAlert, type ApiAlertBatch } from '$lib/Api/alerts.server';
import { getAlerts, getEquipment } from '$lib/Api/organization.server';
import { getSensorHistory } from '$lib/Api/iot.server';
import { refusDecisionQualite } from '$lib/server/guards';
import { alertsToCold, listActiveColdAlerts, pickTelemetrySensor } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const sensorId = url.searchParams.get('sensor');

	const [alerts, equipment] = await Promise.all([
		getAlerts(fetch, cookies),
		getEquipment(fetch, cookies)
	]);

	if (!alerts.ok || !equipment.ok) {
		return {
			alerts: [],
			error: alerts.message || equipment.message,
			telemetry: null,
			telemetryError: null,
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

	const rows = alertsToCold(alerts.data, equipment.data, batchesByAlertId);

	let telemetry: {
		sensorId: string;
		points: { timestamp: string; temperature: number }[];
		threshold: number | null;
	} | null = null;

	const targetSensor = pickTelemetrySensor(alerts.data, equipment.data, sensorId);

	// Un échec de la télémétrie ne doit pas escamoter la section : la page se contentait de ne rien
	// afficher, si bien qu'un capteur muet et une télémétrie tombée donnaient le même écran vide.
	// Sous un bandeau « incident critique », l'absence de courbe se lit comme « tout va bien ».
	let telemetryError: string | null = null;

	if (targetSensor) {
		const history = await getSensorHistory(fetch, cookies, targetSensor, 48);
		const equip = equipment.data.find((e) => e.sensor_id === targetSensor);
		telemetry = {
			sensorId: targetSensor,
			points: history.ok
				? history.data.data.map((p) => ({
						timestamp: p.timestamp,
						temperature: Number(p.temperature)
					}))
				: [],
			threshold: equip?.temp_seuil_max != null ? Number(equip.temp_seuil_max) : null
		};
		if (!history.ok) telemetryError = history.message;
	}

	return {
		alerts: rows,
		error: null,
		telemetry,
		telemetryError,
		selectedSensor: targetSensor
	};
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

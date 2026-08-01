/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });

const organization = { getAlerts: vi.fn(), getEquipment: vi.fn() };
const alerts = { getAlertBatches: vi.fn(), resolveAlert: vi.fn() };
const iot = { getSensorHistory: vi.fn() };

vi.mock('$lib/Api/organization.server', () => organization);
vi.mock('$lib/Api/alerts.server', () => alerts);
vi.mock('$lib/Api/iot.server', () => iot);

const { load } = await import('./+page.server');

const run = (search = '') =>
	(load as any)({
		fetch: vi.fn(),
		cookies: {},
		url: new URL(`http://localhost/chaine-du-froid${search}`)
	});

const coldAlert = (partial: Record<string, unknown> = {}) => ({
	id: 'alerte-groupe-2',
	type: 'TEMP_EXCURSION',
	niveau_gravite: 'PANIC',
	message: 'Excursion sur le groupe 2',
	statut: 'ACTIVE',
	created_at: '2026-08-01T15:48:00.000Z',
	id_materiel: 'frigo-2',
	...partial
});

/**
 * L'ordre est celui qu'a renvoyé l'API au moment du défaut : le groupe 1, non concerné par
 * l'incident, arrivait en tête. C'est lui que `equipment.data.find((e) => e.sensor_id)` prenait.
 */
const equipement = [
	{ id: 'frigo-1', nom: 'Groupe 1', sensor_id: 'SENSOR-FROID-A1', temp_seuil_max: 4 },
	{ id: 'frigo-2', nom: 'Groupe 2', sensor_id: 'SENSOR-FROID-A2', temp_seuil_max: 4 }
];

beforeEach(() => {
	vi.clearAllMocks();
	organization.getAlerts.mockResolvedValue(ok([coldAlert()]));
	organization.getEquipment.mockResolvedValue(ok(equipement));
	alerts.getAlertBatches.mockResolvedValue(ok([]));
	iot.getSensorHistory.mockResolvedValue(
		ok({ data: [{ timestamp: '2026-08-01T15:50:00.000Z', temperature: '7.4' }] })
	);
});

describe('chargement de la chaîne du froid', () => {
	/**
	 * Le défaut vivait dans cette ligne de route, pas dans une fonction : la courbe suivait « le
	 * premier matériel muni d'un capteur » au lieu du matériel de l'incident. Elle illustrait donc
	 * une autre chambre que le bandeau, et passait à « aucune donnée » dès que l'API réordonnait sa
	 * liste — ce que la simple ingestion d'une mesure suffisait à provoquer.
	 */
	it('interroge le capteur de l’incident, pas le premier matériel de la liste', async () => {
		const data = await run();

		expect(iot.getSensorHistory).toHaveBeenCalledTimes(1);
		expect(iot.getSensorHistory.mock.calls[0][2]).toBe('SENSOR-FROID-A2');
		expect(data.selectedSensor).toBe('SENSOR-FROID-A2');
		expect(data.telemetry?.sensorId).toBe('SENSOR-FROID-A2');
	});

	it('reste sur le même capteur quand l’API réordonne le matériel', async () => {
		organization.getEquipment.mockResolvedValue(ok([...equipement].reverse()));

		const data = await run();

		expect(data.selectedSensor).toBe('SENSOR-FROID-A2');
	});

	it('honore le capteur demandé dans l’URL', async () => {
		const data = await run('?sensor=SENSOR-FROID-A1');

		expect(iot.getSensorHistory.mock.calls[0][2]).toBe('SENSOR-FROID-A1');
		expect(data.selectedSensor).toBe('SENSOR-FROID-A1');
	});

	it('n’interroge aucun capteur quand le matériel de l’incident n’en porte pas', async () => {
		organization.getEquipment.mockResolvedValue(
			ok([
				{ id: 'frigo-1', nom: 'Groupe 1', sensor_id: 'SENSOR-FROID-A1', temp_seuil_max: 4 },
				{ id: 'frigo-2', nom: 'Groupe 2', sensor_id: null, temp_seuil_max: 4 }
			])
		);

		const data = await run();

		expect(iot.getSensorHistory).not.toHaveBeenCalled();
		expect(data.telemetry).toBeNull();
	});

	/**
	 * La page escamotait toute la section quand l'historique échouait : un capteur muet et une
	 * télémétrie tombée donnaient le même écran vide, sous un bandeau « incident critique ».
	 */
	it('garde la courbe et dit pourquoi quand l’historique échoue', async () => {
		iot.getSensorHistory.mockResolvedValue({
			ok: false,
			status: 503,
			message: 'Service de télémétrie indisponible'
		});

		const data = await run();

		expect(data.telemetry?.sensorId).toBe('SENSOR-FROID-A2');
		expect(data.telemetry?.points).toEqual([]);
		expect(data.telemetryError).toBe('Service de télémétrie indisponible');
	});

	it('ne signale aucune erreur quand le capteur répond simplement à vide', async () => {
		iot.getSensorHistory.mockResolvedValue(ok({ data: [] }));

		const data = await run();

		expect(data.telemetry?.points).toEqual([]);
		expect(data.telemetryError).toBeNull();
	});

	it('joint le seuil du matériel de l’incident, pas celui d’un autre', async () => {
		organization.getEquipment.mockResolvedValue(
			ok([
				{ id: 'frigo-1', nom: 'Groupe 1', sensor_id: 'SENSOR-FROID-A1', temp_seuil_max: 12 },
				{ id: 'frigo-2', nom: 'Groupe 2', sensor_id: 'SENSOR-FROID-A2', temp_seuil_max: 4 }
			])
		);

		const data = await run();

		expect(data.telemetry?.threshold).toBe(4);
	});
});

import { describe, it, expect } from 'vitest';
import { coldStatusLabel } from './cold/statusLabel';
import { ncStatusLabel } from './nc/statusLabel';
import { recallStatusLabel } from './recall/statusLabel';
import { lotStatusLabel } from './lots/lotStatusLabel';
import { syncLabel } from './integration/syncLabel';
import { equipmentLabelPath } from './equipment/labelPath';

// Ces libellés sont ce que le jury lit à l'écran : une clé oubliée rend « undefined » en pleine
// démonstration. Chaque statut du type doit donc avoir sa traduction.

describe('libellés de statut', () => {
	it('traduit les deux gravités d’alerte froid', () => {
		expect(coldStatusLabel('critique')).toBe('Critique');
		expect(coldStatusLabel('investigation')).toBe('Investigation');
	});

	it('traduit les statuts de non-conformité', () => {
		expect(ncStatusLabel('en_cours')).toBe('En cours');
		expect(ncStatusLabel('quarantaine')).toBe('Quarantaine');
	});

	it('traduit les statuts de rappel', () => {
		expect(recallStatusLabel('en_cours')).toBe('En cours');
		expect(recallStatusLabel('cloture')).toBe('Clôturé');
	});

	it('traduit tous les statuts de lot, y compris l’inconnu', () => {
		expect(lotStatusLabel('conforme')).toBe('Conforme');
		expect(lotStatusLabel('attente_qc')).toBe('En attente de contrôle');
		expect(lotStatusLabel('surveillance')).toBe('Sous rappel');
		expect(lotStatusLabel('quarantaine')).toBe('Quarantaine');
		expect(lotStatusLabel('en_production')).toBe('En production');
		expect(lotStatusLabel('epuise')).toBe('Épuisé');
		expect(lotStatusLabel('rebut')).toBe('Mis au rebut');
		expect(lotStatusLabel('perime')).toBe('Périmé');
		expect(lotStatusLabel('expedie')).toBe('Expédié');
		expect(lotStatusLabel('inconnu')).toBe('Inconnu');
	});

	it('traduit l’état de synchronisation des connecteurs', () => {
		expect(syncLabel('ok')).toBe('OK');
		expect(syncLabel('latence')).toBe('Latence');
	});
});

describe('equipmentLabelPath', () => {
	it('encode l’identifiant — un id à slash casserait la route d’étiquette', () => {
		expect(equipmentLabelPath('frigo/1')).toBe('/configuration/equipment/frigo%2F1/label');
	});
});

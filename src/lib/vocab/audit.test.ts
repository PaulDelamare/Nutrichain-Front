import { describe, it, expect } from 'vitest';
import {
	AUDIT_ACTION_LABELS,
	AUDIT_ENTITY_LABELS,
	AUDIT_ACTION_OPTIONS,
	AUDIT_ENTITY_OPTIONS,
	auditActionLabel,
	auditEntityLabel
} from './audit';

/**
 * Actions réellement journalisées par l'API — instantané du `grep action:` dans Nutrichain-Api. Une
 * action ajoutée côté API doit l'être ici ET traduite : sinon le tableau afficherait l'enum brut,
 * exactement le défaut qu'on corrige. L'enum reste la valeur en base ; seul l'affichage est traduit.
 */
const ACTIONS_API = [
	'ADD',
	'ALERT_RESOLVED',
	'ARCHIVE_CUSTOMER',
	'ARCHIVE_LOCATION',
	'ARCHIVE_PRODUCT',
	'ARCHIVE_SUPPLIER',
	'BATCH_RECALL_TRIGGERED',
	'BATCH_WITHDRAWN_FROM_SHELF',
	'CHANGE_MEMBER_ROLE',
	'CONFIRM_SHIPMENT_DELIVERY',
	'CONFIRM_SHIPMENT_DELIVERY_REJOUEE',
	'CONTROLE_QUALITE',
	'CREATE',
	'CREATE_CUSTOMER',
	'CREATE_EQUIPMENT',
	'CREATE_IOT_GATEWAY',
	'CREATE_LOCATION',
	'CREATE_LOGISTIC_UNIT',
	'CREATE_ORGANIZATION',
	'CREATE_PRODUCT',
	'CREATE_QUALITY_CONTROL',
	'CREATE_RECEIPT',
	'CREATE_RECEIPT_VIA_SYNC',
	'CREATE_SHIPMENT',
	'CREATE_SUPPLIER',
	'DELETE',
	'DEPLACEMENT',
	'IMPORT_CREATE_CUSTOMER',
	'IMPORT_CREATE_PRODUCT',
	'IMPORT_UPDATE_CUSTOMER',
	'IMPORT_UPDATE_PRODUCT',
	'IT_LOCK_PROBE',
	'LEVEE_QUARANTAINE',
	'LIFT_BATCH_QUARANTINE',
	'LIFT_QUALITY_QUARANTINE',
	'LIVRAISON',
	'MISE_AU_REBUT',
	'MOVE_BATCH',
	'MOVE_LOGISTIC_UNIT',
	'OBSERVE',
	'OPEN_LOGISTIC_UNIT',
	'QUARANTAINE_FROID',
	'REACTIVATE_CUSTOMER',
	'REACTIVATE_LOCATION',
	'REACTIVATE_SUPPLIER',
	'RECEPTION',
	'REVOKE_IOT_GATEWAY',
	'REVOKE_MEMBER',
	'SCRAP_BATCH',
	'TEMP_EXCURSION_DETECTED',
	'TRANSFER_OWNERSHIP',
	'TRANSFORM_CONSUME',
	'TRANSFORM_CREATE',
	'UPDATE_CUSTOMER',
	'UPDATE_LOCATION',
	'UPDATE_PRODUCT',
	'UPDATE_SUPPLIER',
	'USER_ANONYMIZED'
];

/** Entités tracées — instantané du `grep entity:` (hors artefacts de test Pizza/Test). */
const ENTITIES_API = [
	'Alert',
	'Batch',
	'Customer',
	'Equipment',
	'IotGateway',
	'Location',
	'Logistic_Unit',
	'Member',
	'Organization',
	'Product',
	'Receipt',
	'Shipment',
	'Supplier',
	'Transformation',
	'User',
	'Withdrawal'
];

describe('vocab audit — complétude des traductions', () => {
	it('traduit toutes les actions journalisées par l’API (aucun enum brut affiché)', () => {
		const manquantes = ACTIONS_API.filter((a) => !AUDIT_ACTION_LABELS[a]);
		expect(manquantes).toEqual([]);
	});

	it('traduit toutes les entités tracées', () => {
		const manquantes = ENTITIES_API.filter((e) => !AUDIT_ENTITY_LABELS[e]);
		expect(manquantes).toEqual([]);
	});

	it('retombe sur l’enum brut pour une valeur inconnue (visible, pas masquée)', () => {
		expect(auditActionLabel('ACTION_INCONNUE')).toBe('ACTION_INCONNUE');
		expect(auditEntityLabel('Inconnu')).toBe('Inconnu');
	});

	it('les options de filtre couvrent toute l’énumération traduite, triées par libellé', () => {
		expect(AUDIT_ACTION_OPTIONS.map((o) => o.value).sort()).toEqual(
			Object.keys(AUDIT_ACTION_LABELS).sort()
		);
		expect(AUDIT_ACTION_OPTIONS.every((o) => o.label === AUDIT_ACTION_LABELS[o.value])).toBe(true);
		expect(AUDIT_ENTITY_OPTIONS.map((o) => o.value).sort()).toEqual(
			Object.keys(AUDIT_ENTITY_LABELS).sort()
		);
	});
});

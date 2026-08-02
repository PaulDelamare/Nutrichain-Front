/**
 * Vocabulaire d'audit : l'ENUM reste la source de vérité en base (colonne `action` / `entity` du
 * journal WORM) ; ce module ne fait que le TRADUIRE pour l'affichage. Rien ici ne remplace l'enum
 * côté API — on lit `l.action`, on affiche `auditActionLabel(l.action)`.
 *
 * `auditActionLabel` / `auditEntityLabel` retombent sur l'enum brut si une valeur n'est pas encore
 * cartographiée : c'est visible plutôt que masqué, et le test de complétude interdit qu'une action
 * réellement journalisée par l'API y échappe.
 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
	ADD: 'Ajout',
	CREATE: 'Création',
	UPDATE: 'Modification',
	DELETE: 'Suppression',
	INIT: 'Initialisation',
	OBSERVE: 'Observation',

	CREATE_ORGANIZATION: 'Organisation créée',
	TRANSFER_OWNERSHIP: 'Transfert de propriété',
	CHANGE_MEMBER_ROLE: 'Rôle modifié',
	REVOKE_MEMBER: 'Accès révoqué',
	USER_ANONYMIZED: 'Utilisateur anonymisé',

	CREATE_EQUIPMENT: 'Matériel créé',
	CREATE_IOT_GATEWAY: 'Passerelle IoT créée',
	REVOKE_IOT_GATEWAY: 'Passerelle IoT révoquée',
	CREATE_LOCATION: 'Emplacement créé',
	UPDATE_LOCATION: 'Emplacement modifié',
	ARCHIVE_LOCATION: 'Emplacement archivé',
	REACTIVATE_LOCATION: 'Emplacement réactivé',

	CREATE_PRODUCT: 'Produit créé',
	UPDATE_PRODUCT: 'Produit modifié',
	ARCHIVE_PRODUCT: 'Produit archivé',
	IMPORT_CREATE_PRODUCT: 'Produit créé (import)',
	IMPORT_UPDATE_PRODUCT: 'Produit modifié (import)',

	CREATE_SUPPLIER: 'Fournisseur créé',
	UPDATE_SUPPLIER: 'Fournisseur modifié',
	ARCHIVE_SUPPLIER: 'Fournisseur archivé',
	REACTIVATE_SUPPLIER: 'Fournisseur réactivé',

	CREATE_CUSTOMER: 'Client créé',
	UPDATE_CUSTOMER: 'Client modifié',
	ARCHIVE_CUSTOMER: 'Client archivé',
	REACTIVATE_CUSTOMER: 'Client réactivé',
	IMPORT_CREATE_CUSTOMER: 'Client créé (import)',
	IMPORT_UPDATE_CUSTOMER: 'Client modifié (import)',

	RECEPTION: 'Réception',
	CREATE_RECEIPT: 'Réception enregistrée',
	CREATE_RECEIPT_VIA_SYNC: 'Réception (mobile)',
	CREATE_SHIPMENT: 'Expédition créée',
	CONFIRM_SHIPMENT_DELIVERY: 'Arrivée constatée',
	// L'API distingue le rejeu par un AUTRE acteur : c'est un désaccord sur la date d'arrivée, et
	// c'est la ligne qu'on cherchera en cas de litige. Le libellé doit le dire, pas le lisser.
	CONFIRM_SHIPMENT_DELIVERY_REJOUEE: 'Arrivée reconfirmée par un autre acteur',
	LIVRAISON: 'Arrivée chez le client',
	EXPEDITION: 'Expédition',
	DEPLACEMENT: 'Changement d’emplacement',
	MOVE_BATCH: 'Lot déplacé',
	SCRAP_BATCH: 'Lot mis au rebut',
	MISE_AU_REBUT: 'Mise au rebut',
	// Les deux vocabulaires du registre : l'action d'audit et le type de mouvement.
	BATCH_WITHDRAWN_FROM_SHELF: 'Retrait du rayon d’un magasin',
	RETRAIT_MAGASIN: 'Retrait du rayon',

	CREATE_LOGISTIC_UNIT: 'Unité logistique créée',
	OPEN_LOGISTIC_UNIT: 'Unité logistique ouverte',
	MOVE_LOGISTIC_UNIT: 'Unité logistique déplacée',

	CONTROLE_QUALITE: 'Contrôle qualité',
	CREATE_QUALITY_CONTROL: 'Contrôle qualité enregistré',
	LIFT_BATCH_QUARANTINE: 'Levée de quarantaine',
	LEVEE_QUARANTAINE: 'Levée de quarantaine',
	LIFT_QUALITY_QUARANTINE: 'Levée de quarantaine qualité',
	LEVEE_QUARANTAINE_QUALITE: 'Levée de quarantaine qualité',
	QUARANTAINE_FROID: 'Quarantaine froid',
	BATCH_RECALL_TRIGGERED: 'Rappel déclenché',
	ALERT_RESOLVED: 'Alerte résolue',
	TEMP_EXCURSION_DETECTED: 'Excursion de température',
	// Sonde interne du verrou consultatif (tests d'intégrité) — traduite pour ne pas exposer l'enum.
	IT_LOCK_PROBE: 'Sonde d’intégrité (test)',

	TRANSFORM_CONSUME: 'Transformation — consommation',
	TRANSFORM_CREATE: 'Transformation — production',
	TRANSFORMATION_ENTREE: 'Transformation — entrée',
	TRANSFORMATION_SORTIE: 'Transformation — sortie'
};

export function auditActionLabel(action: string): string {
	return AUDIT_ACTION_LABELS[action] ?? action;
}

/** Type d'entité tracée. L'enum reste en base ; on le traduit pour le tableau et le filtre. */
export const AUDIT_ENTITY_LABELS: Record<string, string> = {
	Alert: 'Alerte',
	Batch: 'Lot',
	Customer: 'Client',
	Equipment: 'Matériel',
	IotGateway: 'Passerelle IoT',
	Location: 'Emplacement',
	Logistic_Unit: 'Unité logistique',
	Member: 'Membre',
	Organization: 'Organisation',
	Product: 'Produit',
	Receipt: 'Réception',
	Shipment: 'Expédition',
	Supplier: 'Fournisseur',
	Transformation: 'Transformation',
	User: 'Utilisateur',
	Withdrawal: 'Retrait magasin'
};

export function auditEntityLabel(entity: string): string {
	return AUDIT_ENTITY_LABELS[entity] ?? entity;
}

type Option = { value: string; label: string };

const byLabel = (a: Option, b: Option) => a.label.localeCompare(b.label, 'fr');

/**
 * Options des selects de filtre : toute l'énumération traduite (et NON les seules valeurs de la page
 * courante — la liste est paginée côté API, une page n'en montre qu'une fraction).
 */
export const AUDIT_ACTION_OPTIONS: Option[] = Object.entries(AUDIT_ACTION_LABELS)
	.map(([value, label]) => ({ value, label }))
	.sort(byLabel);

export const AUDIT_ENTITY_OPTIONS: Option[] = Object.entries(AUDIT_ENTITY_LABELS)
	.map(([value, label]) => ({ value, label }))
	.sort(byLabel);

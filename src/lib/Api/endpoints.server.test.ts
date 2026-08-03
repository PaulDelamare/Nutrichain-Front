import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';

vi.mock('$env/dynamic/private', () => ({
	env: { API_URL: 'http://api.test', API_KEY: 'cle-de-test' }
}));

const org = await import('./organization.server');
const alerts = await import('./alerts.server');
const trace = await import('./traceability.server');
const logistics = await import('./logistics.server');
const platform = await import('./platform.server');
const iot = await import('./iot.server');
const identity = await import('./identity.server');
const connectors = await import('./connectors.server');
const audit = await import('./audit.server');

type Appel = { url: string; init?: RequestInit };

const appels: Appel[] = [];

const fetchEspion = (async (url: string, init?: RequestInit) => {
	appels.push({ url: String(url), init });
	return new Response(JSON.stringify({ message: 'OK', data: null }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
}) as unknown as typeof globalThis.fetch;

const cookies = {
	getAll: () => [{ name: 'better-auth.session_token', value: 'jeton' }]
} as Cookies;

beforeEach(() => {
	appels.length = 0;
});

const dernier = () => appels[appels.length - 1];
const chemin = () => dernier().url.replace('http://api.test', '');
const methode = () => dernier().init?.method ?? 'GET';
const corps = () => JSON.parse(String(dernier().init?.body ?? 'null'));
const cleApiEnvoyee = () => new Headers(dernier().init?.headers).has('x-api-key');

/**
 * Chaque entrée décrit le contrat qu'une page attend du wrapper : la méthode HTTP et la route de
 * l'API. Un renommage de route côté API casse le front en silence — ici il casse un test.
 */
const routes: [nom: string, appel: () => unknown, methode: string, chemin: string][] = [
	// Organisation
	[
		'getMembers',
		() => org.getMembers(fetchEspion, cookies),
		'GET',
		'/api/organization/members?page=1&limit=25'
	],
	[
		'getLogisticUnitBySscc',
		() => logistics.getLogisticUnitBySscc(fetchEspion, cookies, '034567890000000606'),
		'GET',
		'/api/logistics/logistic-units/by-sscc/034567890000000606'
	],
	[
		'changeMemberRole',
		() => org.changeMemberRole(fetchEspion, cookies, 'm1', 'quality'),
		'PATCH',
		'/api/organization/members/m1/role'
	],
	[
		'revokeMember',
		() => org.revokeMember(fetchEspion, cookies, 'm1'),
		'POST',
		'/api/organization/members/m1/revoke'
	],
	['getAlerts', () => org.getAlerts(fetchEspion, cookies), 'GET', '/api/organization/alerts'],
	[
		'getRecalls',
		() => org.getRecalls(fetchEspion, cookies),
		'GET',
		'/api/organization/recalls?page=1&limit=25'
	],
	[
		'getAlertBatches',
		() => alerts.getAlertBatches(fetchEspion, cookies, 'alert-1'),
		'GET',
		'/api/alerts/alert-1/batches'
	],
	[
		'getQualityControls',
		() => org.getQualityControls(fetchEspion, cookies),
		'GET',
		'/api/organization/quality-controls'
	],
	[
		'getQuarantineBatches',
		() => org.getQuarantineBatches(fetchEspion, cookies),
		'GET',
		'/api/organization/quarantine-batches'
	],
	[
		'getEquipment',
		() => org.getEquipment(fetchEspion, cookies),
		'GET',
		'/api/organization/equipment'
	],
	[
		'createEquipment',
		() =>
			org.createEquipment(fetchEspion, cookies, { nom: 'Frigo 1', type: 'FRIGO', id_lieu: 'l1' }),
		'POST',
		'/api/organization/equipment'
	],
	[
		'createSupplier',
		() =>
			org.createSupplier(fetchEspion, cookies, {
				nom_ferme: 'Ferme du Val',
				adresse_siege: '1 rue des Prés'
			}),
		'POST',
		'/api/organization/suppliers'
	],
	[
		'updateSupplier',
		() => org.updateSupplier(fetchEspion, cookies, 's1', { nom_ferme: 'Ferme B' }),
		'PATCH',
		'/api/organization/suppliers/s1'
	],
	[
		'setSupplierActive',
		() => org.setSupplierActive(fetchEspion, cookies, 's1', false),
		'PATCH',
		'/api/organization/suppliers/s1/active'
	],
	[
		'createLocation',
		() => org.createLocation(fetchEspion, cookies, { nom: 'Entrepôt', type: 'ENTREPOT' }),
		'POST',
		'/api/organization/locations'
	],
	[
		'updateLocation',
		() => org.updateLocation(fetchEspion, cookies, 'l1', { nom: 'Entrepôt Nord' }),
		'PATCH',
		'/api/organization/locations/l1'
	],
	[
		'setLocationActive',
		() => org.setLocationActive(fetchEspion, cookies, 'l1', true),
		'PATCH',
		'/api/organization/locations/l1/active'
	],
	[
		'createCustomer',
		() =>
			org.createCustomer(fetchEspion, cookies, {
				nom_enseigne: 'Carrefour',
				adresse_livraison: '2 av. du Port'
			}),
		'POST',
		'/api/organization/customers'
	],
	[
		'setCustomerActive',
		() => org.setCustomerActive(fetchEspion, cookies, 'c1', false),
		'PATCH',
		'/api/organization/customers/c1/active'
	],
	[
		'createProduct',
		() =>
			org.createProduct(fetchEspion, cookies, {
				nom: 'Lait 1L',
				code_gtin: '03701234500012',
				categorie: 'LAITIER',
				duree_conservation_defaut: 10,
				seuil_alerte_stock: 50,
				unite_reference: 'L'
			}),
		'POST',
		'/api/organization/products'
	],
	[
		'setProductActive',
		() => org.setProductActive(fetchEspion, cookies, 'p1', true),
		'PATCH',
		'/api/organization/products/p1/active'
	],
	[
		'getShipments',
		() => org.getShipments(fetchEspion, cookies),
		'GET',
		'/api/organization/shipments?page=1&limit=50'
	],
	[
		'getPendingQualityControl',
		() => org.getPendingQualityControl(fetchEspion, cookies),
		'GET',
		'/api/organization/pending-quality-control'
	],
	[
		'createQualityControl',
		() =>
			org.createQualityControl(fetchEspion, cookies, {
				id_lot: 'lot-1',
				type_test: 'Microbio',
				resultat: 'CONFORME'
			}),
		'POST',
		'/api/organization/quality-controls'
	],

	// Traçabilité
	[
		'getProducts',
		() => trace.getProducts(fetchEspion, cookies),
		'GET',
		'/api/traceability/products'
	],
	[
		'getGenealogy',
		() => trace.getGenealogy(fetchEspion, cookies, 'lot-1'),
		'GET',
		'/api/traceability/batches/lot-1/genealogy'
	],
	[
		'triggerRecall',
		() => trace.triggerRecall(fetchEspion, cookies, 'lot-1', 'Listeria'),
		'POST',
		'/api/traceability/batches/lot-1/recall'
	],

	// Logistique
	[
		'getBatchById',
		() => logistics.getBatchById(fetchEspion, cookies, 'lot-1'),
		'GET',
		'/api/logistics/batches/lot-1'
	],
	[
		'releaseQuarantine',
		() => logistics.releaseQuarantine(fetchEspion, cookies, 'lot-1', 'Analyse conforme'),
		'POST',
		'/api/logistics/batches/lot-1/release'
	],
	[
		'createReceipt',
		() =>
			logistics.createReceipt(fetchEspion, cookies, {
				id_fournisseur: 'f1',
				shipment_id: 'BL-1',
				id_produit: 'p1',
				quantite_actuelle: 10,
				unite_code: 'KG',
				statut_controle: 'OK'
			}),
		'POST',
		'/api/logistics/receipts'
	],
	[
		'createShipment',
		() =>
			logistics.createShipment(fetchEspion, cookies, {
				id_client: 'c1',
				shipment_id: 'AUTO',
				transporteur: 'Chrono',
				destination_adresse: '12 rue Test, Rennes',
				lots: [{ id_lot: 'lot-1', quantite_expediee: 5 }]
			}),
		'POST',
		'/api/logistics/shipments'
	],
	[
		'confirmShipmentDelivery',
		() => logistics.confirmShipmentDelivery(fetchEspion, cookies, 'exp-1'),
		'POST',
		'/api/logistics/shipments/exp-1/delivered'
	],
	[
		'resolveBatchByLotNumber',
		() => logistics.resolveBatchByLotNumber(fetchEspion, cookies, 'LOT-1'),
		'GET',
		'/api/logistics/batches/resolve?lot_number=LOT-1'
	],
	[
		'createTransformation',
		() =>
			trace.createTransformation(fetchEspion, cookies, {
				id_produit_fini: 'p1',
				id_materiel: 'e1',
				quantite_produite: 10,
				unite_code: 'KG',
				inputs: [{ id_lot_parent: 'lot-1', quantite_prelevee: 10, unite: 'KG' }]
			}),
		'POST',
		'/api/traceability/transformations'
	],

	// Plateforme
	[
		'getOrganizations',
		() => platform.getOrganizations(fetchEspion, cookies),
		'GET',
		'/api/platform/organizations'
	],
	[
		'createOrganization',
		() => platform.createOrganization(fetchEspion, cookies, { name: 'Acme', slug: 'acme' }),
		'POST',
		'/api/platform/organizations'
	],
	[
		'inviteOrganizationOwner',
		() => platform.inviteOrganizationOwner(fetchEspion, cookies, 'o1', 'chef@acme.fr'),
		'POST',
		'/api/platform/organizations/o1/owner'
	],

	// Identité
	[
		'sendInvitation',
		() =>
			identity.sendInvitation(fetchEspion, cookies, {
				email: 'a@b.fr',
				role: 'quality',
				organizationId: 'o1'
			}),
		'POST',
		'/api/identity/invitations'
	],
	[
		'getInvitationPreview',
		() => identity.getInvitationPreview(fetchEspion, 'tok123'),
		'GET',
		'/api/identity/invitations/tok123/preview'
	],

	// Connecteurs & audit
	[
		'importProductsCsv',
		() => connectors.importProductsCsv(fetchEspion, cookies, 'nom;gtin'),
		'POST',
		'/api/connectors/imports/products'
	],
	[
		'importCustomersCsv',
		() => connectors.importCustomersCsv(fetchEspion, cookies, 'nom;adresse'),
		'POST',
		'/api/connectors/imports/customers'
	],
	['verifyAudit', () => audit.verifyAudit(fetchEspion, cookies), 'GET', '/api/audit/verify']
];

describe('wrappers API — méthode et route appelées', () => {
	it.each(routes)('%s appelle %s %s', async (_nom, appel, methodeAttendue, cheminAttendu) => {
		await appel();
		expect(`${methode()} ${chemin()}`).toBe(`${methodeAttendue} ${cheminAttendu}`);
	});
});

describe('construction des paramètres de requête', () => {
	it('getBatches transmet la recherche à l’API plutôt que de filtrer 100 lignes côté client', async () => {
		await trace.getBatches(fetchEspion, cookies, { search: '260711-000201' });
		expect(chemin()).toBe('/api/traceability/batches?q=260711-000201');
	});

	it('getBatches n’ajoute aucun paramètre pour une recherche vide', async () => {
		await trace.getBatches(fetchEspion, cookies, { search: '   ' });
		expect(chemin()).toBe('/api/traceability/batches');
	});

	/**
	 * ⚠️ Sans `page`, l'API ne sert que ses 100 lots les plus récents : un lot plus ancien était
	 * déclaré inexistant faute de pouvoir demander la suite.
	 */
	it('getBatches demande la page et la taille de page voulues', async () => {
		await trace.getBatches(fetchEspion, cookies, { search: 'lait', page: 3, limit: 50 });
		expect(chemin()).toBe('/api/traceability/batches?q=lait&page=3&limit=50');
	});

	it('getBatchList demande d’emblée le plafond de l’API — un sélecteur ne pagine pas', async () => {
		await trace.getBatchList(fetchEspion, cookies);
		expect(chemin()).toBe(`/api/traceability/batches?limit=${trace.MAX_BATCH_PAGE_SIZE}`);
	});

	const repond = (data: unknown) =>
		(async () =>
			new Response(JSON.stringify({ message: 'OK', data }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})) as unknown as typeof globalThis.fetch;

	it('getBatchList réduit la réponse paginée à ses lignes', async () => {
		const res = await trace.getBatchList(
			repond({
				data: [{ id: 'lot-1' }],
				pagination: { page: 1, limit: 500, total: 342, totalPages: 1 }
			}),
			cookies
		);

		expect(res.ok && res.data).toEqual([{ id: 'lot-1' }]);
	});

	/**
	 * Filet de déploiement : le front peut atteindre une API pas encore paginée, qui répond par un
	 * tableau nu. Mieux vaut une liste correcte qu'un écran de lots en erreur.
	 */
	it('getBatches accepte encore la réponse non paginée d’une API antérieure', async () => {
		const res = await trace.getBatches(repond([{ id: 'lot-1' }, { id: 'lot-2' }]), cookies);

		expect(res.ok && res.data.data).toHaveLength(2);
		expect(res.ok && res.data.pagination.total).toBe(2);
	});

	it('getMovements n’envoie que les filtres réellement demandés', async () => {
		await trace.getBatches(fetchEspion, cookies);
		await org.getMovements(fetchEspion, cookies);
		expect(chemin()).toBe('/api/organization/movements');

		await org.getMovements(fetchEspion, cookies, { limit: 10, lotId: 'lot-1' });
		expect(chemin()).toBe('/api/organization/movements?limit=10&lotId=lot-1');
	});

	it('getAuditLogs pagine dès la première page', async () => {
		await org.getAuditLogs(fetchEspion, cookies);
		expect(chemin()).toBe('/api/organization/audit-logs?page=1&limit=25');
	});

	it('les référentiels masquent les archives sauf demande explicite', async () => {
		await org.getSuppliers(fetchEspion, cookies);
		expect(chemin()).toBe('/api/organization/suppliers');

		await org.getCustomers(fetchEspion, cookies);
		expect(chemin()).toBe('/api/organization/customers');

		await org.getLocations(fetchEspion, cookies, true);
		expect(chemin()).toBe('/api/organization/locations?includeArchived=true');

		await org.getProductsForConfig(fetchEspion, cookies, true);
		expect(chemin()).toBe('/api/traceability/products?includeArchived=true');
	});

	it('getLocationsForConfig pagine (chemin paginé de la page Configuration)', async () => {
		await org.getLocationsForConfig(fetchEspion, cookies);
		expect(chemin()).toBe('/api/organization/locations?page=1&limit=25');
	});

	it('getConfigCounts interroge l’endpoint de compteurs', async () => {
		await org.getConfigCounts(fetchEspion, cookies);
		expect(chemin()).toBe('/api/organization/config-counts');
	});

	/**
	 * #82 — Fournisseurs et clients ont DEUX lectures, parce que l'API en sert deux charges utiles
	 * différentes selon le rôle. Les confondre derrière un booléen laissait croire au front qu'il
	 * recevait toujours `is_active` : il refiltrait dessus, et vidait le sélecteur pour les rôles
	 * terrain.
	 */
	it('l’administration demande explicitement les archivés, les écrans terrain jamais', async () => {
		await org.getSuppliersForConfig(fetchEspion, cookies);
		expect(chemin()).toBe('/api/organization/suppliers?includeArchived=true');

		await org.getCustomersForConfig(fetchEspion, cookies);
		expect(chemin()).toBe('/api/organization/customers?includeArchived=true');
	});

	it('getReceipts pagine dès la première page', async () => {
		await logistics.getReceipts(fetchEspion, cookies);
		expect(chemin()).toBe('/api/logistics/receipts?page=1&limit=50');
	});

	it('getSensorHistory demande 48 relevés par défaut et encode l’identifiant du capteur', async () => {
		await iot.getSensorHistory(fetchEspion, cookies, 'frigo/1');
		expect(chemin()).toBe('/api/telemetry/frigo%2F1/history?limit=48');
	});

	it('encode l’identifiant de lot dans les routes de traçabilité', async () => {
		await trace.getGenealogy(fetchEspion, cookies, 'lot/1');
		expect(chemin()).toBe('/api/traceability/batches/lot%2F1/genealogy');
	});

	it('transmet le motif du rappel — sans motif, la décision n’est pas traçable', async () => {
		await trace.triggerRecall(fetchEspion, cookies, 'lot-1', 'Suspicion Listeria');
		expect(corps()).toEqual({ reason: 'Suspicion Listeria' });
	});

	it('transmet le motif de la levée de quarantaine', async () => {
		await logistics.releaseQuarantine(fetchEspion, cookies, 'lot-1', 'Analyse conforme');
		expect(corps()).toEqual({ motif: 'Analyse conforme' });
	});
});

describe('choix du mode d’authentification', () => {
	// Une clé API identifie un service, pas une personne. Les décisions qui engagent quelqu'un
	// doivent voyager avec la session pour que l'audit nomme le bon auteur.
	it.each([
		['changeMemberRole', () => org.changeMemberRole(fetchEspion, cookies, 'm1', 'quality')],
		['revokeMember', () => org.revokeMember(fetchEspion, cookies, 'm1')],
		[
			'createQualityControl',
			() =>
				org.createQualityControl(fetchEspion, cookies, {
					id_lot: 'l1',
					type_test: 'Microbio',
					resultat: 'NON_CONFORME'
				})
		],
		['importProductsCsv', () => connectors.importProductsCsv(fetchEspion, cookies, 'csv')],
		[
			'confirmShipmentDelivery',
			() => logistics.confirmShipmentDelivery(fetchEspion, cookies, 'exp-1')
		],
		['getBatchById', () => logistics.getBatchById(fetchEspion, cookies, 'lot-1')],
		[
			'getLogisticUnitBySscc',
			() => logistics.getLogisticUnitBySscc(fetchEspion, cookies, '034567890000000606')
		],
		['getAlertBatches', () => alerts.getAlertBatches(fetchEspion, cookies, 'alert-1')],
		// La route API est gardée par `requireAuth` + `requireOrgRole` : la clé n'y sert à rien, et
		// l'envoyer expédiait un secret serveur sur un appel qui ne le demande pas. Deux fonctions
		// frappaient cet endpoint, l'une avec la clé et l'autre sans — c'est cette duplication qui
		// avait laissé passer le défaut d'encodage de #78.
		['getGenealogy', () => trace.getGenealogy(fetchEspion, cookies, 'lot-1')],
		[
			'createReceipt',
			() =>
				logistics.createReceipt(fetchEspion, cookies, {
					id_fournisseur: 'f1',
					shipment_id: 'BL-1',
					id_produit: 'p1',
					quantite_actuelle: 1,
					unite_code: 'KG',
					statut_controle: 'OK'
				})
		],
		[
			'createTransformation',
			() =>
				trace.createTransformation(fetchEspion, cookies, {
					id_produit_fini: 'p1',
					id_materiel: 'e1',
					quantite_produite: 1,
					unite_code: 'KG',
					inputs: [{ id_lot_parent: 'l1', quantite_prelevee: 1, unite: 'KG' }]
				})
		]
	])('%s s’authentifie par session, sans clé API', async (_nom, appel) => {
		await appel();
		expect(cleApiEnvoyee()).toBe(false);
	});

	it('les lectures de catalogue peuvent utiliser la clé API du service', async () => {
		await trace.getBatches(fetchEspion, cookies);
		expect(cleApiEnvoyee()).toBe(true);
	});
});

describe('batchLabelPath', () => {
	it('encode l’identifiant du lot dans le lien d’étiquette', () => {
		expect(logistics.batchLabelPath('lot/1')).toBe('/fiche-lot/lot%2F1/label');
	});
});

/**
 * #78 — Le jeton d'invitation était interpolé dans le chemin sans encodage, sur une page
 * ACCESSIBLE SANS AUTHENTIFICATION et sans validation de forme. Un jeton contenant `../` sortait
 * donc du préfixe de la route : la requête partait ailleurs, avec l'en-tête `x-api-key` du front —
 * un secret serveur que le visiteur ne possède pas. Il choisissait le chemin d'un GET émis sous
 * l'identité applicative du front.
 *
 * L'assertion porte sur la NORMALISATION réelle d'une URL, pas sur une comparaison de chaîne :
 * c'est `fetch` qui résout `..`, et c'est donc son résultat qui doit rester dans le préfixe.
 */
describe('traversée de chemin par un identifiant hostile (#78)', () => {
	const HOSTILE = '../../auth/sign-up/email';

	const cheminNormalise = () => new URL(chemin(), 'http://api.test').pathname;

	it('le jeton d’invitation ne peut pas sortir de sa route', async () => {
		await identity.getInvitationPreview(fetchEspion, HOSTILE);

		expect(cheminNormalise()).toMatch(/^\/api\/identity\/invitations\//);
		expect(cheminNormalise()).not.toContain('/api/auth/');
	});

	/**
	 * Même classe, mêmes conséquences, et ces appels partagent le fichier avec des fonctions qui,
	 * elles, encodaient déjà : la règle était connue et appliquée à moitié.
	 */
	it('la généalogie par identifiant ne peut pas sortir de sa route', async () => {
		await trace.getGenealogy(fetchEspion, cookies, HOSTILE);

		expect(cheminNormalise()).toMatch(/^\/api\/traceability\/batches\//);
	});

	it('un identifiant de membre ne peut pas sortir de sa route', async () => {
		await org.revokeMember(fetchEspion, cookies, HOSTILE);

		expect(cheminNormalise()).toMatch(/^\/api\/organization\/members\//);
	});

	it('un identifiant de lot logistique ne peut pas sortir de sa route', async () => {
		await logistics.getBatchById(fetchEspion, cookies, HOSTILE);

		expect(cheminNormalise()).toMatch(/^\/api\/logistics\/batches\//);
	});
});

/**
 * #78 — Le défaut n'était pas l'ignorance de la règle : six appels de ce dossier encodaient déjà
 * leur identifiant. Elle était appliquée à MOITIÉ — au point que deux fonctions frappaient le MÊME
 * endpoint de généalogie, l'une en encodant et l'autre non. Le doublon a depuis été fusionné.
 *
 * Une revue ne rattrape pas ça de façon fiable. Ce test relit les clients d'API et échoue si un
 * segment de chemin est interpolé sans encodage. C'est ce qui empêche la quatrième occurrence.
 */
describe('tout segment de chemin est encodé (#78)', () => {
	it('aucun client d’API n’interpole un identifiant brut dans un chemin', async () => {
		const { readdirSync, readFileSync } = await import('fs');
		const { join } = await import('path');

		const dossier = join(process.cwd(), 'src', 'lib', 'Api');
		const fautifs: string[] = [];

		for (const nom of readdirSync(dossier)) {
			if (!nom.endsWith('.server.ts') || nom.includes('.test.')) continue;
			const source = readFileSync(join(dossier, nom), 'utf-8');

			source.split('\n').forEach((ligne, index) => {
				// Un `${…}` précédé d'un `/` DANS un gabarit de chemin `/api/…` : c'est un segment.
				// Les chaînes de requête (`?limit=${…}`) sont hors sujet — elles ne traversent pas.
				for (const m of ligne.matchAll(/`\/api\/[^`]*?\/\$\{([^}]+)\}/g)) {
					const expression = m[1];
					if (!expression.includes('encodeURIComponent')) {
						fautifs.push(`${nom}:${index + 1} → \${${expression}}`);
					}
				}
			});
		}

		expect(fautifs).toEqual([]);
	});
});

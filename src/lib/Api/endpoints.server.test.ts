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
	['getMembers', () => org.getMembers(fetchEspion, cookies), 'GET', '/api/organization/members'],
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
		'/api/organization/shipments'
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
		'getBatchGenealogy',
		() => trace.getBatchGenealogy(fetchEspion, cookies, 'lot-1'),
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

	it('getAuditLogs plafonne le journal à 30 entrées par défaut', async () => {
		await org.getAuditLogs(fetchEspion, cookies);
		expect(chemin()).toBe('/api/organization/audit-logs?limit=30');
	});

	it('les référentiels masquent les archives sauf demande explicite', async () => {
		await org.getSuppliers(fetchEspion, cookies);
		expect(chemin()).toBe('/api/organization/suppliers');

		await org.getSuppliers(fetchEspion, cookies, true);
		expect(chemin()).toBe('/api/organization/suppliers?includeArchived=true');

		await org.getLocations(fetchEspion, cookies, true);
		expect(chemin()).toBe('/api/organization/locations?includeArchived=true');

		await org.getCustomers(fetchEspion, cookies, true);
		expect(chemin()).toBe('/api/organization/customers?includeArchived=true');

		await org.getProductsForConfig(fetchEspion, cookies, true);
		expect(chemin()).toBe('/api/traceability/products?includeArchived=true');
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
		['getBatchById', () => logistics.getBatchById(fetchEspion, cookies, 'lot-1')],
		['getAlertBatches', () => alerts.getAlertBatches(fetchEspion, cookies, 'alert-1')]
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

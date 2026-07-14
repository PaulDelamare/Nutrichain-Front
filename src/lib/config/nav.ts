import type { Pathname } from '$app/types';
import { ADMIN_ROLES, type KnownRole, type Role } from './roles';

export type NavItem = {
	href: Pathname;
	label: string;
	/** Titre affiché dans le header fixe */
	title: string;
	/** Titre principal dans la zone de contenu */
	heading: string;
	description?: string;
	roles?: Role[];
};

export type NavGroup = {
	label: string;
	items: NavItem[];
};

export const navGroups: NavGroup[] = [
	{
		label: 'Pilotage',
		items: [
			{
				href: '/tableau-de-bord',
				label: 'Tableau de bord',
				title: 'Tableau de bord',
				heading: "Vue d'ensemble",
				description: 'KPI temps réel — lots suivis, alertes, rappels et synchronisations.'
			},
			{
				href: '/recherche-lots',
				label: 'Recherche lots',
				title: 'Recherche de lots',
				heading: 'Recherche de lots',
				description: 'Filtres — GTIN, numéro de lot, produit, site et statut.'
			},
			{
				href: '/tracabilite',
				label: 'Traçabilité',
				title: 'Traçabilité',
				heading: 'Arbre de traçabilité',
				description: 'Vue amont / aval — matières premières vers produits finis et expéditions.'
			},
			{
				href: '/scan-code-barres',
				label: 'Scan code-barres',
				title: 'Scan code-barres',
				heading: 'Scan de code-barres',
				description:
					'Scannez un GTIN ou un identifiant de lot pour accéder instantanément à sa fiche.'
			}
		]
	},
	{
		label: 'Qualité & risques',
		items: [
			{
				href: '/chaine-du-froid',
				label: 'Chaîne du froid',
				title: 'Chaîne du froid',
				heading: 'Alertes chaîne du froid',
				description: 'Surveillance temps réel — seuils, capteurs, escalade qualité.'
			},
			{
				href: '/non-conformites',
				label: 'Non-conformités',
				title: 'Non-conformités',
				heading: 'Non-conformités & quarantaine',
				description: 'Suivi des écarts, causes, actions correctives et lots bloqués.'
			},
			{
				href: '/rappels-produits',
				label: 'Rappels produits',
				title: 'Rappels produits',
				heading: 'Rappels produits',
				description: 'Workflow — lots concernés, sites impactés, progression des retraits.'
			},
			{
				href: '/simulation-rappel',
				label: 'Simulation de rappel',
				title: 'Simulation de rappel',
				heading: 'Simulation de rappel',
				description:
					"Estimez l'impact d'un rappel (lots et expéditions touchés) sans rien bloquer en base."
			}
		]
	},
	{
		label: 'Réseau',
		items: [
			{
				href: '/receptions',
				label: 'Réceptions',
				title: 'Réceptions',
				heading: 'Réceptions terrain',
				description: 'Flux entrants — fournisseur, contrôle à réception, lots créés.'
			},
			{
				href: '/expeditions',
				label: 'Expéditions',
				title: 'Expéditions',
				heading: 'Expéditions',
				description: 'Flux sortants — destination, statut de livraison, lots embarqués.'
			},
			{
				href: '/portail-magasins',
				label: 'Portail magasins',
				title: 'Portail magasins',
				heading: 'Portail magasins',
				description:
					'Consignes de retrait, confirmations et traçabilité simplifiée pour la force de vente.'
			},
			{
				href: '/integrations',
				label: 'Intégrations',
				title: 'Intégrations',
				heading: 'Intégrations ERP / WMS / TMS',
				description: "Connecteurs, états de synchronisation et files d'attente.",
				roles: ADMIN_ROLES
			}
		]
	},
	{
		label: 'Système',
		items: [
			{
				href: '/configuration',
				label: 'Configuration',
				title: 'Configuration',
				heading: "Configuration de l'usine",
				description:
					'Emplacements et fournisseurs — les données de référence de votre organisation.',
				roles: ADMIN_ROLES
			},
			{
				href: '/utilisateurs',
				label: 'Utilisateurs',
				title: 'Utilisateurs',
				heading: 'Utilisateurs, rôles & sécurité',
				description: 'Gestion des accès — RBAC, MFA, politique de mot de passe.',
				roles: ADMIN_ROLES
			},
			{
				href: '/audit-logs',
				label: 'Audit & logs',
				title: 'Audit & logs',
				heading: 'Audit & logs',
				description: "Journal d'audit et événements système.",
				roles: ADMIN_ROLES
			}
		]
	}
];

export function navPourRole(role: KnownRole): NavGroup[] {
	return navGroups
		.map((groupe) => ({
			...groupe,
			items: groupe.items.filter(
				(item) => !item.roles || role === undefined || (role !== null && item.roles.includes(role))
			)
		}))
		.filter((groupe) => groupe.items.length > 0);
}

const flatNav = navGroups.flatMap((g) => g.items);

export function findNavItem(pathname: string): NavItem | undefined {
	if (pathname.startsWith('/fiche-lot/')) {
		return flatNav.find((item) => item.href === '/recherche-lots');
	}
	return flatNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

const fallbackTitle = 'NutriChain';

export function headerTitle(pathname: string): string {
	if (pathname.startsWith('/fiche-lot/')) {
		return findNavItem(pathname)?.title ?? 'Recherche de lots';
	}
	return findNavItem(pathname)?.title ?? fallbackTitle;
}

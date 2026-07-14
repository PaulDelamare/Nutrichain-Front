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
	/**
	 * Rôles qui voient l'entrée. Absent = visible par tous.
	 * On ne masque que les pages dont l'API refuserait déjà la donnée : sans ça, le lien mène à
	 * une page vide portant une erreur brute, indistinguable d'une panne.
	 */
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
				description: 'Filtres avancés — GTIN, lot, SSCC, produit, site, dates, statut.'
			},
			{
				href: '/tracabilite',
				label: 'Traçabilité',
				title: 'Traçabilité',
				heading: 'Arbre de traçabilité',
				description: 'Vue amont / aval — matières premières vers produits finis et expéditions.'
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
			}
		]
	},
	{
		label: 'Réseau',
		items: [
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

/**
 * Navigation visible par ce rôle. Un rôle inconnu (API sans le champ) voit TOUT : mieux vaut un
 * lien qui mène à une page refusée qu'une application amputée pour son propriétaire.
 * Les groupes vidés disparaissent — on ne laisse pas un intitulé de section sans entrée.
 */
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

// findNavItem/headerTitle lisent la nav COMPLÈTE : le titre d'une page reste correct même quand
// son entrée est masquée (accès par URL directe).
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

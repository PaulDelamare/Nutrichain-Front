export type NavItem = {
	href: string;
	label: string;
	/** Titre affiché dans le header fixe */
	title: string;
	/** Titre principal dans la zone de contenu */
	heading: string;
	description?: string;
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
				heading: 'Vue d\'ensemble',
				description: 'KPI temps réel — lots suivis, alertes, rappels et synchronisations.'
			},
			{
				href: '/recherche-lots',
				label: 'Recherche lots',
				title: 'Recherche de lots',
				heading: 'Recherche de lots',
				description:
					'Filtres avancés — GTIN, lot, SSCC, produit, site, dates, statut.'
			},
			{
				href: '/fiche-lot',
				label: 'Fiche lot',
				title: 'Fiche lot',
				heading: 'Fiche lot',
				description:
					'Produit, dates, statut, historique, température, évènements EPCIS, localisation.'
			},
			{
				href: '/tracabilite',
				label: 'Traçabilité',
				title: 'Traçabilité',
				heading: 'Arbre de traçabilité',
				description:
					'Vue amont / aval — matières premières vers produits finis et expéditions.'
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
				description:
					'Surveillance temps réel — seuils, capteurs, escalade qualité.'
			},
			{
				href: '/non-conformites',
				label: 'Non-conformités',
				title: 'Non-conformités',
				heading: 'Non-conformités & quarantaine',
				description:
					'Suivi des écarts, causes, actions correctives et lots bloqués.'
			},
			{
				href: '/rappels-produits',
				label: 'Rappels produits',
				title: 'Rappels produits',
				heading: 'Rappels produits',
				description:
					'Workflow — lots concernés, sites impactés, progression des retraits.'
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
				description: 'Connecteurs, états de synchronisation et files d\'attente.'
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
				description: 'Gestion des accès — RBAC, MFA, politique de mot de passe.'
			},
			{
				href: '/audit-logs',
				label: 'Audit & logs',
				title: 'Audit & logs',
				heading: 'Audit & logs',
				description: 'Journal d\'audit et événements système.'
			}
		]
	}
];

const flatNav = navGroups.flatMap((g) => g.items);

export function findNavItem(pathname: string): NavItem | undefined {
	return flatNav.find(
		(item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
	);
}

const fallbackTitle = 'NutriChain';

export function headerTitle(pathname: string): string {
	return findNavItem(pathname)?.title ?? fallbackTitle;
}

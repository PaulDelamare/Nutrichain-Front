import type { AppUser } from '$lib/types/user';

export const users: AppUser[] = [
	{
		email: 'marie.dupont@entreprise.fr',
		role: 'Qualité',
		lastLogin: "Aujourd'hui — 09:14",
		mfa: true
	},
	{
		email: 'log.idf@entreprise.fr',
		role: 'Logistique',
		lastLogin: 'Hier — 17:42',
		mfa: true
	}
];

import type { KnownRole } from '$lib/config/roles';

export type SessionUser = {
	id: string;
	name: string;
	email: string;
	role: KnownRole;
	isPlatformAdmin: boolean;
};

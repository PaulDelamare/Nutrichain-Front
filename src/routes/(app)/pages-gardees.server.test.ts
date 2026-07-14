import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import type { KnownRole } from '$lib/config/roles';


const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });

vi.mock('$lib/Api/organization.server', () => ({
	getAuditLogs: vi.fn(async () => ok([])),
	getMembers: vi.fn(async () => ok([]))
}));

vi.mock('$lib/Api/audit.server', () => ({ verifyAudit: vi.fn(async () => ok({ valid: true })) }));
vi.mock('$lib/Api/identity.server', () => ({ sendInvitation: vi.fn() }));
vi.mock('$lib/Api/auth.server', () => ({ getMe: vi.fn() }));

const PAGES = [
	{ nom: 'audit-logs', charger: () => import('./audit-logs/+page.server') },
	{ nom: 'integrations', charger: () => import('./integrations/+page.server') },
	{ nom: 'utilisateurs', charger: () => import('./utilisateurs/+page.server') }
];

const evenement = (role: KnownRole) => ({
	fetch: vi.fn(),
	cookies: {},
	locals: { user: { id: 'u1', name: 'T', email: 't@x.fr', role, isPlatformAdmin: false } }
});

async function statutDuLoad(charger: () => Promise<unknown>, role: KnownRole) {
	const mod = (await charger()) as { load: (e: unknown) => Promise<unknown> };
	try {
		await mod.load(evenement(role));
		return 200;
	} catch (e) {
		return isHttpError(e) ? e.status : 'exception inattendue';
	}
}

beforeEach(() => vi.clearAllMocks());

describe('pages réservées aux administrateurs', () => {
	for (const { nom, charger } of PAGES) {
		it(`/${nom} refuse un viewer`, async () => {
			expect(await statutDuLoad(charger, 'viewer')).toBe(403);
		});

		it(`/${nom} refuse un operator`, async () => {
			expect(await statutDuLoad(charger, 'operator')).toBe(403);
		});

		it(`/${nom} refuse un quality`, async () => {
			expect(await statutDuLoad(charger, 'quality')).toBe(403);
		});

		it(`/${nom} laisse passer un admin`, async () => {
			expect(await statutDuLoad(charger, 'admin')).toBe(200);
		});

		it(`/${nom} laisse passer un owner`, async () => {
			expect(await statutDuLoad(charger, 'owner')).toBe(200);
		});
	}
});

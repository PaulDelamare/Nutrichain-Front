import type { Cookies } from '@sveltejs/kit';
import { api } from './client.server';

export type AuditVerifyResult = {
	organizationId: string;
	valid: boolean;
	rowsChecked: number;
	lastId: number | null;
	lastSignatureHash: string | null;
	lastHorodatage: string | null;
	brokenAtId: number | null;
	brokenAtReason: 'prev_hash_mismatch' | 'signature_mismatch' | 'truncation' | null;
	expectedRowCount: number | null;
	actualRowCount: number | null;
};

/** Recalcule la chaîne d'audit WORM de l'organisation et renvoie son intégrité. */
export function verifyAudit(fetch: typeof globalThis.fetch, cookies: Cookies) {
	return api(fetch, cookies).get<AuditVerifyResult>('/api/audit/verify');
}

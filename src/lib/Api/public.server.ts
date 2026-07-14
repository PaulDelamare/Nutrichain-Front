import { env } from '$env/dynamic/private';

export type PublicScanData = {
	lot: {
		date_peremption: string | null;
		nom_produit: string;
		gtin: string;
		producteur: string;
		statut_sanitaire: 'CONFORME' | 'RAPPEL_CONSOMMATEUR';
	};
	trace: {
		etapes: number;
		message: string;
		etapes_details: { produit: string; date: string }[];
	};
};

type PublicScanResult =
	| { ok: true; data: PublicScanData }
	| { ok: false; status: number; message: string };

export async function getPublicScan(
	fetch: typeof globalThis.fetch,
	id: string
): Promise<PublicScanResult> {
	const base = (env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

	try {
		const res = await fetch(`${base}/api/public/scan/${encodeURIComponent(id)}`, {
			headers: { Accept: 'application/json' }
		});

		const payload = await res.json().catch(() => ({}));

		if (!res.ok) {
			const msg =
				payload.error?.map((e: { message: string }) => e.message).join(' ') ||
				payload.message ||
				'Lot introuvable.';
			return { ok: false, status: res.status, message: msg };
		}

		return { ok: true, data: payload.data as PublicScanData };
	} catch {
		return { ok: false, status: 503, message: 'Service indisponible — réessayez plus tard.' };
	}
}

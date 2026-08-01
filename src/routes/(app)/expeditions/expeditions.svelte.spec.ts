import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import ExpeditionsPage from './+page.svelte';
import type { KnownRole } from '$lib/config/roles';

type Shipment = {
	id: string;
	ref: string;
	client: string;
	statut: string;
	date: string;
	deliveredAt: string | null;
	lots: string;
};

const EN_ROUTE: Shipment = {
	id: '2f1c8a90-3d4e-4f5a-9b6c-7d8e9f0a1b2c',
	ref: 'SSCC-EN-ROUTE',
	client: 'Super U Rennes',
	statut: 'EN_ROUTE',
	date: '30/07/2026 08:00:00',
	deliveredAt: null,
	lots: 'a1b2c3d4'
};

const LIVREE: Shipment = {
	id: '9e8d7c6b-5a4f-4321-8765-0f1e2d3c4b5a',
	ref: 'SSCC-LIVREE',
	client: 'Carrefour Nantes',
	statut: 'LIVRE',
	date: '29/07/2026 09:30:00',
	deliveredAt: '30/07/2026 16:45:00',
	lots: 'e5f6a7b8'
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPage(role: KnownRole, shipments: Shipment[], form: any = null) {
	render(ExpeditionsPage, {
		props: {
			data: { user: { role }, shipments, customers: [], lots: [], error: null },
			form
		}
	} as unknown as SvelteComponentOptions<typeof ExpeditionsPage>);
}

describe("Expéditions — constater l'arrivée", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("propose de confirmer une expédition dont l'arrivée n'est pas constatée", async () => {
		renderPage('operator', [EN_ROUTE]);

		await expect
			.element(page.getByRole('button', { name: 'Confirmer la livraison' }))
			.toBeInTheDocument();
	});

	it('ne propose plus rien une fois la livraison constatée', async () => {
		renderPage('operator', [LIVREE]);

		expect(page.getByRole('button', { name: 'Confirmer la livraison' }).all()).toHaveLength(0);
	});

	it("dit « non constatée » plutôt que de laisser deviner l'arrivée", async () => {
		renderPage('operator', [EN_ROUTE]);

		await expect.element(page.getByText('non constatée')).toBeInTheDocument();
	});

	it("restitue la date d'arrivée quand elle est connue, sans dire « non constatée »", async () => {
		renderPage('operator', [LIVREE]);

		await expect.element(page.getByText('30/07/2026 16:45:00')).toBeInTheDocument();
		expect(page.getByText('non constatée').all()).toHaveLength(0);
	});

	it("soumet l'identifiant de l'expédition à l'action `confirm`, pas sa référence", async () => {
		renderPage('operator', [EN_ROUTE]);

		const form = page
			.getByRole('button', { name: 'Confirmer la livraison' })
			.element()
			.closest('form');
		expect(form?.getAttribute('action')).toBe('?/confirm');
		expect(form?.querySelector('input[name="id"]')?.getAttribute('value')).toBe(EN_ROUTE.id);
	});

	it('refuse le geste au rôle qualité — constater une arrivée est de la manutention', async () => {
		renderPage('quality', [EN_ROUTE]);

		expect(page.getByRole('button', { name: 'Confirmer la livraison' }).all()).toHaveLength(0);
	});

	it('refuse le geste au lecteur', async () => {
		renderPage('viewer', [EN_ROUTE]);

		expect(page.getByRole('button', { name: 'Confirmer la livraison' }).all()).toHaveLength(0);
	});

	it("laisse le lecteur VOIR l'état d'arrivée, qu'il ne peut pas modifier", async () => {
		renderPage('viewer', [EN_ROUTE]);

		await expect.element(page.getByText('non constatée')).toBeInTheDocument();
	});

	it('annonce la confirmation réussie avec sa référence', async () => {
		renderPage('operator', [LIVREE], {
			// Déjà formatée par l'action : le gabarit ne doit pas reformater, sous peine de dater la
			// même arrivée dans deux fuseaux selon qu'on lit le tableau ou le bandeau.
			confirmed: { ref: 'SSCC-LIVREE', date: '30/07/2026 16:45:00' }
		});

		const banner = page.getByRole('status').first();
		await expect.element(banner).toBeInTheDocument();
		expect(banner.element().textContent).toContain('SSCC-LIVREE');
		expect(banner.element().textContent).toContain('30/07/2026 16:45:00');
	});

	/**
	 * La date d'arrivée est scellée en WORM et aucune route ne l'annule : un clic sur la mauvaise
	 * ligne est définitif. On vérifie ici la seule chose qui l'empêche.
	 */
	it("retient la soumission tant que l'opérateur n'a pas confirmé", async () => {
		const dialog = vi.spyOn(window, 'confirm').mockReturnValue(false);
		renderPage('operator', [EN_ROUTE]);

		const deliveryForm = page
			.getByRole('button', { name: 'Confirmer la livraison' })
			.element()
			.closest('form') as HTMLFormElement;
		const submitEvent = new SubmitEvent('submit', { cancelable: true, bubbles: true });
		deliveryForm.dispatchEvent(submitEvent);

		expect(dialog).toHaveBeenCalledWith(expect.stringContaining(EN_ROUTE.ref));
		expect(submitEvent.defaultPrevented).toBe(true);
	});

	it("laisse partir la soumission dès que l'opérateur a confirmé", async () => {
		vi.spyOn(window, 'confirm').mockReturnValue(true);
		renderPage('operator', [EN_ROUTE]);

		const deliveryForm = page
			.getByRole('button', { name: 'Confirmer la livraison' })
			.element()
			.closest('form') as HTMLFormElement;
		const submitEvent = new SubmitEvent('submit', { cancelable: true, bubbles: true });
		deliveryForm.dispatchEvent(submitEvent);

		expect(submitEvent.defaultPrevented).toBe(false);
	});

	it("affiche le refus de l'API au lieu de l'avaler", async () => {
		renderPage('operator', [EN_ROUTE], { confirmError: 'Expedition deja livree.' });

		await expect.element(page.getByText('Expedition deja livree.')).toBeInTheDocument();
	});
});

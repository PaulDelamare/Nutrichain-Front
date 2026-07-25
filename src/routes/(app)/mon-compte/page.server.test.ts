import { describe, it, expect, vi, beforeEach } from 'vitest';

const enableTwoFactor = vi.fn();
const verifyTwoFactorTotp = vi.fn();
const disableTwoFactor = vi.fn();

vi.mock('$lib/Api/auth.server', () => ({
	enableTwoFactor: (...a: unknown[]) => enableTwoFactor(...a),
	verifyTwoFactorTotp: (...a: unknown[]) => verifyTwoFactorTotp(...a),
	disableTwoFactor: (...a: unknown[]) => disableTwoFactor(...a)
}));

const mod = await import('./+page.server');

const fetch = vi.fn();
const cookies = { getAll: () => [] };

function event(body: Record<string, string> = {}) {
	const form = new Map(Object.entries(body));
	return { request: { formData: async () => form }, fetch, cookies };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const actions = mod.actions as any;

beforeEach(() => {
	enableTwoFactor.mockReset();
	verifyTwoFactorTotp.mockReset();
	disableTwoFactor.mockReset();
});

describe('mon-compte — load', () => {
	it("expose l'état 2FA courant de l'utilisateur, lu depuis locals.user (déjà résolu par hooks.server.ts)", async () => {
		const result = await mod.load({
			locals: { user: { twoFactorEnabled: true } }
		} as never);

		expect(result).toEqual({ twoFactorEnabled: true });
	});

	it('se dégrade en désactivé si locals.user est absent', async () => {
		const result = await mod.load({ locals: {} } as never);

		expect(result).toEqual({ twoFactorEnabled: false });
	});
});

describe('mon-compte — enable (démarrer l’enrôlement)', () => {
	it('renvoie le QR code et les codes de secours avec un mot de passe valide', async () => {
		enableTwoFactor.mockResolvedValue({
			ok: true,
			payload: { totpURI: 'otpauth://totp/x', backupCodes: ['a', 'b'] }
		});

		const result = await actions.enable(event({ password: 'NutriChain!2026' }));

		expect(enableTwoFactor).toHaveBeenCalledExactlyOnceWith(fetch, cookies, 'NutriChain!2026');
		expect(result).toMatchObject({
			totpURI: 'otpauth://totp/x',
			backupCodes: ['a', 'b']
		});
	});

	it('refuse sans mot de passe', async () => {
		const result = await actions.enable(event({}));

		expect(enableTwoFactor).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it("relaie l'erreur de l'API (mauvais mot de passe)", async () => {
		enableTwoFactor.mockResolvedValue({ ok: false, status: 401, message: 'Mot de passe invalide' });

		const result = await actions.enable(event({ password: 'faux' }));

		expect(result).toMatchObject({ status: 401, data: { error: 'Mot de passe invalide' } });
	});
});

describe('mon-compte — confirm (valider le code TOTP)', () => {
	it('confirme l’enrôlement avec un code valide', async () => {
		verifyTwoFactorTotp.mockResolvedValue({ ok: true });

		const result = await actions.confirm(event({ code: '123456' }));

		expect(verifyTwoFactorTotp).toHaveBeenCalledExactlyOnceWith(fetch, cookies, '123456');
		expect(result).toMatchObject({ confirmed: true });
	});

	it('refuse un code invalide', async () => {
		verifyTwoFactorTotp.mockResolvedValue({ ok: false, status: 400, message: 'Code invalide' });

		const result = await actions.confirm(event({ code: '000000' }));

		expect(result).toMatchObject({ status: 400, data: { error: 'Code invalide' } });
	});
});

describe('mon-compte — disable', () => {
	it('désactive la 2FA avec le mot de passe', async () => {
		disableTwoFactor.mockResolvedValue({ ok: true });

		const result = await actions.disable(event({ password: 'NutriChain!2026' }));

		expect(disableTwoFactor).toHaveBeenCalledExactlyOnceWith(fetch, cookies, 'NutriChain!2026');
		expect(result).toMatchObject({ disabled: true });
	});

	it('refuse sans mot de passe', async () => {
		const result = await actions.disable(event({}));

		expect(disableTwoFactor).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});
});

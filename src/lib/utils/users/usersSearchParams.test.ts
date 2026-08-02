import { describe, it, expect } from 'vitest';
import { usersPageSizeParams, usersSearchParams } from './usersSearchParams';
import { emptyUserFilters } from '$lib/types/user';

const params = (init = '') => new URLSearchParams(init);

describe('usersSearchParams', () => {
	it('ne pose aucun filtre quand tout est vide / « tous »', () => {
		expect(usersSearchParams(params(), emptyUserFilters()).toString()).toBe('');
	});

	it('ignore un e-mail de moins de 3 caractères', () => {
		const out = usersSearchParams(params(), { ...emptyUserFilters(), email: 'an' });
		expect(out.has('email')).toBe(false);
	});

	it('pose l’e-mail dès 3 caractères (trimé)', () => {
		const out = usersSearchParams(params(), { ...emptyUserFilters(), email: '  ana@x  ' });
		expect(out.get('email')).toBe('ana@x');
	});

	it('pose le rôle sauf la sentinelle « tous »', () => {
		const out = usersSearchParams(params(), { ...emptyUserFilters(), role: 'operator' });
		expect(out.get('role')).toBe('operator');
	});

	it('traduit le tri-état MFA en booléen d’API (actif→true, inactif→false, tous→absent)', () => {
		expect(usersSearchParams(params(), { ...emptyUserFilters(), mfa: 'actif' }).get('mfa')).toBe(
			'true'
		);
		expect(usersSearchParams(params(), { ...emptyUserFilters(), mfa: 'inactif' }).get('mfa')).toBe(
			'false'
		);
		expect(usersSearchParams(params(), { ...emptyUserFilters(), mfa: 'tous' }).has('mfa')).toBe(
			false
		);
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = usersSearchParams(params('page=4'), { ...emptyUserFilters(), role: 'admin' });
		expect(out.has('page')).toBe(false);
	});

	it('préserve les autres paramètres (ex. limit)', () => {
		const out = usersSearchParams(params('limit=50'), { ...emptyUserFilters(), role: 'viewer' });
		expect(out.get('limit')).toBe('50');
	});
});

describe('usersPageSizeParams', () => {
	it('pose la taille et repart en première page, en gardant les filtres', () => {
		const out = usersPageSizeParams(params('page=5&role=operator'), 25);
		expect(out.get('limit')).toBe('25');
		expect(out.has('page')).toBe(false);
		expect(out.get('role')).toBe('operator');
	});
});

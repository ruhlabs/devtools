import { describe, expect, it } from 'vitest';
import { hasThaana, isThaana, toLatin, toThaana } from './index.js';

const pairs: Array<[thaana: string, latin: string]> = [
	['ދިވެހި', 'dhivehi'],
	['ރާއްޖެ', 'raajje'],
	['ދިވެހިރާއްޖެ', 'dhivehiraajje'],
	['މާލެ', 'maale'],
	['ހުޅުމާލެ', 'hulhumaale'],
	['ފުނަދޫ', 'funadhoo'],
	['ތާނަ', 'thaana'],
	['ތިނެއް', 'thineh'],
	['އަހަރެން', 'aharen']
];

describe('toLatin', () => {
	it.each(pairs)('%s → %s', (thaana, latin) => {
		expect(toLatin(thaana)).toBe(latin);
	});

	it('keeps spaces and non-Thaana text', () => {
		expect(toLatin('Hello ދިވެހި ރާއްޖެ!')).toBe('Hello dhivehi raajje!');
	});

	it('converts Arabic-script punctuation', () => {
		expect(toLatin('ދިވެހި، މާލެ؟')).toBe('dhivehi, maale?');
	});
});

describe('toThaana', () => {
	it.each(pairs)('%s ← %s', (thaana, latin) => {
		expect(toThaana(latin)).toBe(thaana);
	});

	it('is case-insensitive and keeps other characters', () => {
		expect(toThaana('Dhivehi Raajje, 2026')).toBe('ދިވެހި ރާއްޖެ, 2026');
	});

	it('round-trips through toLatin', () => {
		for (const [, latin] of pairs) expect(toLatin(toThaana(latin))).toBe(latin);
	});
});

describe('detection', () => {
	it('hasThaana', () => {
		expect(hasThaana('hello')).toBe(false);
		expect(hasThaana('hello ދިވެހި')).toBe(true);
	});

	it('isThaana', () => {
		expect(isThaana('ދިވެހި ރާއްޖެ، 2026')).toBe(true);
		expect(isThaana('hello ދިވެހި')).toBe(false);
		expect(isThaana('')).toBe(false);
	});
});

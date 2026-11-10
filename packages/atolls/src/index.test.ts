import { describe, expect, it } from 'vitest';
import { ATOLLS, CITIES, formatIslandAddress, getAtoll, getCity, parseIslandAddress } from './index.js';

describe('data', () => {
	it('has 20 atolls with unique codes, Thaana codes and ISO codes', () => {
		expect(ATOLLS).toHaveLength(20);
		for (const key of ['code', 'codeThaana', 'iso', 'latinLetter'] as const) {
			expect(new Set(ATOLLS.map((a) => a[key])).size).toBe(20);
		}
	});

	it('has the five cities, each pointing at a real atoll', () => {
		expect(CITIES.map((c) => c.name)).toEqual(['Malé', 'Addu', 'Fuvahmulah', 'Kulhudhuffushi', 'Thinadhoo']);
		for (const city of CITIES) if (city.atoll) expect(getAtoll(city.atoll)).toBeDefined();
	});
});

describe('getAtoll', () => {
	it.each(['HA', 'ha', 'Haa Alifu', 'Haa Alif', 'Haa Alif Atoll', 'ހއ', 'Thiladhunmathi Uthuruburi', 'MV-07'])('finds Haa Alifu from %j', (q) => {
		expect(getAtoll(q)?.code).toBe('HA');
	});

	it('finds others', () => {
		expect(getAtoll('Kaafu')?.capital).toBe('Thulusdhoo');
		expect(getAtoll('Male Atoll')?.code).toBe('K');
		expect(getAtoll('Addu')?.code).toBe('S');
		expect(getAtoll('Gaaf Dhaal')?.code).toBe('GDh');
		expect(getAtoll('ގދ')?.code).toBe('GDh');
	});

	it('returns undefined for unknown input', () => {
		expect(getAtoll('Atlantis')).toBeUndefined();
		expect(getAtoll('')).toBeUndefined();
	});
});

describe('getCity', () => {
	it('finds cities with or without "City" and accents', () => {
		expect(getCity('Male')?.iso).toBe('MV-MLE');
		expect(getCity('Addu City')?.atoll).toBe('S');
		expect(getCity('Hulhumalé')).toBeUndefined();
	});
});

describe('island addresses', () => {
	it.each([
		['B. Eydhafushi', 'B', 'Eydhafushi'],
		['HDh Kulhudhuffushi', 'HDh', 'Kulhudhuffushi'],
		['GA.Villingili', 'GA', 'Villingili'],
		['sh. Funadhoo', 'Sh', 'Funadhoo'],
		['ބ. އޭދަފުށި', 'B', 'އޭދަފުށި']
	])('parses %j', (input, code, island) => {
		const parsed = parseIslandAddress(input);
		expect(parsed?.atoll.code).toBe(code);
		expect(parsed?.island).toBe(island);
	});

	it('returns undefined without an atoll code', () => {
		expect(parseIslandAddress('Eydhafushi')).toBeUndefined();
		expect(parseIslandAddress('X. Eydhafushi')).toBeUndefined();
	});

	it('formats', () => {
		expect(formatIslandAddress('Baa', 'Eydhafushi')).toBe('B. Eydhafushi');
		expect(formatIslandAddress('B', 'އޭދަފުށި', { thaana: true })).toBe('ބ. އޭދަފުށި');
		expect(() => formatIslandAddress('Nope', 'X')).toThrow();
	});
});

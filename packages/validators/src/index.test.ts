import { describe, expect, it } from 'vitest';
import { isMobile, isValidNationalId, isValidPhone, normalizeNationalId, parsePhone } from './index.js';

describe('parsePhone', () => {
	it.each(['7771234', '777 1234', '777-1234', '+960 777 1234', '+9607771234', '00960 7771234', '960-777-1234', '(960) 777 1234'])(
		'parses %s',
		(input) => {
			expect(parsePhone(input)).toEqual({
				national: '7771234',
				e164: '+9607771234',
				international: '+960 777-1234',
				type: 'mobile'
			});
		}
	);

	it('detects number types', () => {
		expect(parsePhone('9123456')?.type).toBe('mobile');
		expect(parsePhone('3321234')?.type).toBe('landline');
		expect(parsePhone('6681234')?.type).toBe('landline');
	});

	it.each(['', '777123', '77712345', '1234567', '8001234', '+44 777 1234', 'abc1234', '777-1234x'])('rejects %j', (input) => {
		expect(parsePhone(input)).toBeNull();
		expect(isValidPhone(input)).toBe(false);
	});

	it('isMobile', () => {
		expect(isMobile('+960 777 1234')).toBe(true);
		expect(isMobile('3321234')).toBe(false);
	});
});

describe('national ID', () => {
	it.each([
		['A123456', 'A123456'],
		['a123456', 'A123456'],
		[' A 123-456 ', 'A123456']
	])('normalises %j', (input, expected) => {
		expect(normalizeNationalId(input)).toBe(expected);
		expect(isValidNationalId(input)).toBe(true);
	});

	it.each(['', 'A12345', 'A1234567', 'B123456', '123456', 'AA12345'])('rejects %j', (input) => {
		expect(normalizeNationalId(input)).toBeNull();
		expect(isValidNationalId(input)).toBe(false);
	});
});

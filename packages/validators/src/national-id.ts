const NATIONAL_ID = /^A\d{6}$/;

/**
 * Normalise a Maldivian national ID card number: trims, removes spaces and
 * dashes, and uppercases the letter. "a 123-456" → "A123456".
 *
 * Returns `null` if the result isn't in the A + 6 digits format.
 */
export function normalizeNationalId(input: string): string | null {
	const value = input.trim().replace(/[\s-]/g, '').toUpperCase();
	return NATIONAL_ID.test(value) ? value : null;
}

/**
 * True if the input has the format of a Maldivian national ID card number
 * (A followed by 6 digits).
 *
 * This only checks the format. It can't tell whether the card exists or who
 * it belongs to; for real identity verification use eFaas.
 */
export function isValidNationalId(input: string): boolean {
	return normalizeNationalId(input) !== null;
}

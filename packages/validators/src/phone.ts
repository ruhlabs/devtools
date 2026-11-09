export type PhoneType = 'mobile' | 'landline';

export interface ParsedPhone {
	/** 7-digit national number, e.g. "7771234" */
	national: string;
	/** E.164 format, e.g. "+9607771234" */
	e164: string;
	/** Human-readable format, e.g. "+960 777-1234" */
	international: string;
	type: PhoneType;
}

const COUNTRY_CODE = '960';

/**
 * Leading digit → number type. Based on current Maldivian allocations:
 * 7xx/9xx mobile, 3xx/6xx fixed lines.
 */
const TYPES: Readonly<Record<string, PhoneType>> = {
	'7': 'mobile',
	'9': 'mobile',
	'3': 'landline',
	'6': 'landline'
};

/**
 * Parse a Maldivian phone number written in any common style:
 * "7771234", "777 1234", "777-1234", "+960 777 1234", "00960 7771234", "960-777-1234".
 *
 * Returns `null` if it isn't a valid Maldivian number.
 */
export function parsePhone(input: string): ParsedPhone | null {
	let digits = input.trim();
	if (!/^\+?[\d\s\-().]+$/.test(digits)) return null;

	digits = digits.replace(/\D/g, '');
	if (digits.length === 12 && digits.startsWith('00' + COUNTRY_CODE)) digits = digits.slice(5);
	else if (digits.length === 10 && digits.startsWith(COUNTRY_CODE)) digits = digits.slice(3);

	if (!/^\d{7}$/.test(digits)) return null;
	const type = TYPES[digits[0]!];
	if (!type) return null;

	return {
		national: digits,
		e164: `+${COUNTRY_CODE}${digits}`,
		international: `+${COUNTRY_CODE} ${digits.slice(0, 3)}-${digits.slice(3)}`,
		type
	};
}

/** True if the input is a valid Maldivian phone number. */
export function isValidPhone(input: string): boolean {
	return parsePhone(input) !== null;
}

/** True if the input is a valid Maldivian mobile number. */
export function isMobile(input: string): boolean {
	return parsePhone(input)?.type === 'mobile';
}

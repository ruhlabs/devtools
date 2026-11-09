import { createHash, timingSafeEqual } from 'node:crypto';
import type { SignMethod } from './types.js';

/**
 * Compute a BML Connect signature, as documented by BML:
 *
 * - sha1: sha1("amount=2000&currency=MVR&apiKey=…") as hex
 * - md5:  md5("amount=2000&currency=MVR&apiKey=…") as base64
 */
export function sign(amount: number, currency: string, apiKey: string, method: SignMethod = 'sha1'): string {
	const data = `amount=${amount}&currency=${currency}&apiKey=${apiKey}`;
	return method === 'md5' ? createHash('md5').update(data).digest('base64') : createHash('sha1').update(data).digest('hex');
}

/**
 * Check a webhook's (or transaction's) signature against your API key, in
 * constant time. Accepts both sha1 (hex) and md5 (base64) signatures.
 *
 * Always verify webhooks before trusting them: anyone can POST to your URL.
 */
export function verifySignature(
	payload: { amount: number; currency: string; signature?: string },
	apiKey: string
): boolean {
	const given = payload.signature;
	if (typeof given !== 'string' || !given) return false;

	for (const method of ['sha1', 'md5'] as const) {
		const expected = sign(payload.amount, payload.currency, apiKey, method);
		const a = Buffer.from(given);
		const b = Buffer.from(expected);
		if (a.length === b.length && timingSafeEqual(a, b)) return true;
	}
	return false;
}

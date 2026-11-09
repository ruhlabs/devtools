export { BmlConnect, BmlConnectError } from './client.js';
export { sign, verifySignature } from './signature.js';
export type * from './types.js';

/** Convert MVR (or any 2-decimal currency) to laari: 10.5 → 1050. */
export function toLaari(amount: number): number {
	return Math.round(amount * 100);
}

/** Convert laari to MVR: 1050 → 10.5. */
export function fromLaari(laari: number): number {
	return laari / 100;
}

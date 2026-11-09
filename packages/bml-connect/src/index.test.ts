import { describe, expect, it, vi } from 'vitest';
import { BmlConnect, BmlConnectError, fromLaari, sign, toLaari, verifySignature } from './index.js';

// Reference values computed independently (Python hashlib) from BML's documented formula.
const SHA1 = 'f77c49c4a81ae10bd58da11979f849482afc19e8';
const MD5 = 'QxudQg7nJgP4aR2vDenuBA==';

function mockFetch(status: number, body: unknown) {
	return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify(body), { status }));
}

describe('signatures', () => {
	it('matches the documented formula', () => {
		expect(sign(2000, 'MVR', 'mysecretkey')).toBe(SHA1);
		expect(sign(2000, 'MVR', 'mysecretkey', 'md5')).toBe(MD5);
	});

	it('verifies sha1 and md5 signatures', () => {
		expect(verifySignature({ amount: 2000, currency: 'MVR', signature: SHA1 }, 'mysecretkey')).toBe(true);
		expect(verifySignature({ amount: 2000, currency: 'MVR', signature: MD5 }, 'mysecretkey')).toBe(true);
	});

	it('rejects tampered or missing signatures', () => {
		expect(verifySignature({ amount: 2001, currency: 'MVR', signature: SHA1 }, 'mysecretkey')).toBe(false);
		expect(verifySignature({ amount: 2000, currency: 'MVR', signature: SHA1 }, 'otherkey')).toBe(false);
		expect(verifySignature({ amount: 2000, currency: 'MVR' }, 'mysecretkey')).toBe(false);
	});
});

describe('BmlConnect', () => {
	it('creates a signed transaction', async () => {
		const fetch = mockFetch(200, { id: 'tx1', amount: 2000, currency: 'MVR', state: 'QR_CODE_GENERATED', url: 'https://pay.example/tx1' });
		const bml = new BmlConnect({ apiKey: 'mysecretkey', appId: 'app-123', environment: 'sandbox', fetch });

		const tx = await bml.transactions.create({ amount: 2000, currency: 'MVR', localId: 'order-1', redirectUrl: 'https://shop.mv/done' });
		expect(tx.url).toBe('https://pay.example/tx1');

		const [url, init] = fetch.mock.calls[0]!;
		expect(url).toBe('https://api.uat.merchants.bankofmaldives.com.mv/public/transactions');
		expect(init?.method).toBe('POST');
		expect((init?.headers as Record<string, string>).Authorization).toBe('mysecretkey');
		expect(JSON.parse(init?.body as string)).toEqual({
			amount: 2000,
			currency: 'MVR',
			localId: 'order-1',
			redirectUrl: 'https://shop.mv/done',
			apiVersion: '2.0',
			appVersion: '@ruhlabs/bml-connect',
			deviceId: 'app-123',
			signMethod: 'sha1',
			signature: SHA1
		});
	});

	it('uses production by default and supports get/list', async () => {
		const fetch = mockFetch(200, { count: 1, items: [] });
		const bml = new BmlConnect({ apiKey: 'k', appId: 'a', fetch });
		await bml.transactions.list({ page: 2 });
		await bml.transactions.get('5e22e1037ac57f000841efff');
		expect(fetch.mock.calls[0]![0]).toBe('https://api.merchants.bankofmaldives.com.mv/public/transactions?page=2');
		expect(fetch.mock.calls[1]![0]).toBe('https://api.merchants.bankofmaldives.com.mv/public/transactions/5e22e1037ac57f000841efff');
		expect(fetch.mock.calls[1]![1]?.method).toBe('GET');
	});

	it('throws BmlConnectError with the API error code', async () => {
		const bml = new BmlConnect({ apiKey: 'k', appId: 'a', fetch: mockFetch(404, { code: 'PP-01-04', message: 'Transaction not found' }) });
		const err = await bml.transactions.get('nope').catch((e: unknown) => e);
		expect(err).toBeInstanceOf(BmlConnectError);
		expect(err).toMatchObject({ status: 404, code: 'PP-01-04', message: 'BML Connect: Transaction not found' });
	});

	it('validates input before calling the API', async () => {
		const fetch = mockFetch(200, {});
		const bml = new BmlConnect({ apiKey: 'k', appId: 'a', fetch });
		await expect(bml.transactions.create({ amount: 10.5, currency: 'MVR' })).rejects.toThrow(RangeError);
		await expect(bml.transactions.create({ amount: 50, currency: 'MVR' })).rejects.toThrow(RangeError);
		await expect(bml.transactions.create({ amount: 1000, currency: 'mvr' })).rejects.toThrow(RangeError);
		expect(fetch).not.toHaveBeenCalled();
		expect(() => new BmlConnect({ apiKey: '', appId: 'a' })).toThrow();
	});

	it('verifies webhooks', () => {
		const bml = new BmlConnect({ apiKey: 'mysecretkey', appId: 'a', fetch: mockFetch(200, {}) });
		const webhook = { transactionId: 'tx1', state: 'CONFIRMED', amount: 2000, currency: 'MVR', signature: SHA1 };
		expect(bml.verifyWebhook(webhook)).toBe(true);
		expect(bml.verifyWebhook({ ...webhook, amount: 1 })).toBe(false);
		expect(bml.verifyWebhook('nope')).toBe(false);
	});
});

describe('laari helpers', () => {
	it('converts', () => {
		expect(toLaari(10.5)).toBe(1050);
		expect(toLaari(0.1 + 0.2)).toBe(30);
		expect(fromLaari(1050)).toBe(10.5);
	});
});

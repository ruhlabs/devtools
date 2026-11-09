import { sign, verifySignature } from './signature.js';
import type {
	BmlConnectOptions,
	CreateTransactionInput,
	Transaction,
	TransactionList,
	WebhookPayload
} from './types.js';

const BASE_URLS = {
	production: 'https://api.merchants.bankofmaldives.com.mv/public',
	sandbox: 'https://api.uat.merchants.bankofmaldives.com.mv/public'
} as const;

const API_VERSION = '2.0';

/** Error returned by the BML Connect API. */
export class BmlConnectError extends Error {
	readonly status: number;
	/** BML error code, e.g. "PP-xx-xx", when the API sends one. */
	readonly code?: string;
	readonly body: unknown;

	constructor(status: number, body: unknown) {
		const details = (body ?? {}) as { code?: string; message?: string };
		super(details.message ? `BML Connect: ${details.message}` : `BML Connect request failed with status ${status}`);
		this.name = 'BmlConnectError';
		this.status = status;
		this.code = details.code;
		this.body = body;
	}
}

export class BmlConnect {
	readonly transactions: Transactions;
	readonly #apiKey: string;
	readonly #appId: string;
	readonly #appVersion: string;
	readonly #baseUrl: string;
	readonly #fetch: typeof fetch;

	constructor(options: BmlConnectOptions) {
		if (!options.apiKey) throw new Error('BmlConnect: apiKey is required');
		if (!options.appId) throw new Error('BmlConnect: appId is required');
		if ('document' in globalThis) {
			console.warn('BmlConnect: running in a browser exposes your API key. Use this on your server only.');
		}

		this.#apiKey = options.apiKey;
		this.#appId = options.appId;
		this.#appVersion = options.appVersion ?? '@ruhlabs/bml-connect';
		this.#baseUrl = (options.baseUrl ?? BASE_URLS[options.environment ?? 'production']).replace(/\/+$/, '');
		this.#fetch = options.fetch ?? globalThis.fetch;
		this.transactions = new Transactions(this);
	}

	/** Verify a webhook payload's signature with this client's API key. */
	verifyWebhook(payload: unknown): payload is WebhookPayload {
		if (!payload || typeof payload !== 'object') return false;
		const p = payload as Partial<WebhookPayload>;
		if (typeof p.amount !== 'number' || typeof p.currency !== 'string') return false;
		return verifySignature({ amount: p.amount, currency: p.currency, signature: p.signature }, this.#apiKey);
	}

	/** @internal */
	_sign(amount: number, currency: string): string {
		return sign(amount, currency, this.#apiKey, 'sha1');
	}

	/** @internal */
	_meta() {
		return { apiVersion: API_VERSION, appVersion: this.#appVersion, deviceId: this.#appId, signMethod: 'sha1' as const };
	}

	/** @internal */
	async _request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
		const res = await this.#fetch(`${this.#baseUrl}${path}`, {
			method,
			headers: {
				Authorization: this.#apiKey,
				Accept: 'application/json',
				...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
			},
			body: body !== undefined ? JSON.stringify(body) : undefined
		});

		const text = await res.text();
		let data: unknown = undefined;
		if (text) {
			try {
				data = JSON.parse(text);
			} catch {
				data = text;
			}
		}
		if (!res.ok) throw new BmlConnectError(res.status, data);
		return data as T;
	}
}

class Transactions {
	readonly #client: BmlConnect;

	constructor(client: BmlConnect) {
		this.#client = client;
	}

	/**
	 * Create a transaction. Redirect the customer to `transaction.url` to pay.
	 *
	 * `amount` is in laari: 1000 = MVR 10.00. Use `toLaari(10)` to convert.
	 */
	async create(input: CreateTransactionInput): Promise<Transaction> {
		if (!Number.isInteger(input.amount) || input.amount < 100) {
			throw new RangeError('BmlConnect: amount must be a whole number of laari, at least 100 (MVR 1.00)');
		}
		if (!/^[A-Z]{3}$/.test(input.currency)) {
			throw new RangeError('BmlConnect: currency must be a 3-letter ISO 4217 code, e.g. "MVR"');
		}
		return this.#client._request<Transaction>('POST', '/transactions', {
			...input,
			...this.#client._meta(),
			signature: this.#client._sign(input.amount, input.currency)
		});
	}

	/** Get one transaction by its BML ID. */
	async get(id: string): Promise<Transaction> {
		if (!id) throw new Error('BmlConnect: transaction id is required');
		return this.#client._request<Transaction>('GET', `/transactions/${encodeURIComponent(id)}`);
	}

	/** List transactions, newest pages first. Pages start at 1. */
	async list(options: { page?: number } = {}): Promise<TransactionList> {
		const query = options.page ? `?page=${encodeURIComponent(options.page)}` : '';
		return this.#client._request<TransactionList>('GET', `/transactions${query}`);
	}
}

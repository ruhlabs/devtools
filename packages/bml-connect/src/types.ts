export type Environment = 'production' | 'sandbox';

export type SignMethod = 'sha1' | 'md5';

export type TransactionState = 'QR_CODE_GENERATED' | 'CONFIRMED' | 'CANCELLED' | 'REFUND_REQUESTED' | 'REFUNDED';

export interface BmlConnectOptions {
	/** API key (client_secret) from the BML merchant portal. Keep it on the server. */
	apiKey: string;
	/** Application ID (client_id) from the merchant portal. */
	appId: string;
	/** Defaults to "production". Use "sandbox" for the UAT environment. */
	environment?: Environment;
	/** Sent as `appVersion`, so you can tell your integrations apart. Defaults to "@ruhlabs/bml-connect". */
	appVersion?: string;
	/** Override the base URL (for proxies or tests). */
	baseUrl?: string;
	/** Custom fetch implementation. Defaults to the global `fetch`. */
	fetch?: typeof fetch;
}

export interface CreateTransactionInput {
	/** Amount in laari (the smallest unit): 1000 = MVR 10.00. Minimum 100. */
	amount: number;
	/** ISO 4217 currency code, e.g. "MVR" or "USD". */
	currency: string;
	/** Payment method enabled for your merchant account (e.g. "card", "alipay"). Omit to let the customer choose. */
	provider?: string;
	/** Your own reference, e.g. an order ID. */
	localId?: string;
	/** Reference shown to the customer, e.g. "Invoice 2026-123". */
	customerReference?: string;
	/** Where to send the customer after the payment completes or fails (e-commerce only). */
	redirectUrl?: string;
}

export interface Transaction {
	id: string;
	amount: number;
	currency: string;
	state: TransactionState;
	/** Payment page to redirect the customer to. */
	url?: string;
	provider?: string;
	localId?: string;
	customerReference?: string;
	redirectUrl?: string;
	qrcode?: { url: string };
	/** ISO timestamp (UTC). */
	created?: string;
	signature?: string;
	[key: string]: unknown;
}

export interface TransactionList {
	/** Total number of transactions across all pages. */
	count: number;
	items: Transaction[];
}

export interface WebhookPayload {
	transactionId: string;
	state: TransactionState;
	amount: number;
	currency: string;
	signature: string;
	localId?: string;
	customerReference?: string;
	provider?: string;
	created?: string;
	qrCode?: { url: string };
	[key: string]: unknown;
}

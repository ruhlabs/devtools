# @ruhlabs/bml-connect

A typed Node.js client for the **Bank of Maldives (BML) Connect** payment API: create payments, check their status and verify webhooks.

> **Server only.** It needs your BML API key, which must never reach a browser.

```bash
npm install @ruhlabs/bml-connect
```

Requires Node 20+ (or Bun/Deno). No dependencies.

## Usage

```ts
import { BmlConnect, toLaari } from '@ruhlabs/bml-connect';

const bml = new BmlConnect({
  apiKey: process.env.BML_API_KEY!, // from the BML merchant portal
  appId: process.env.BML_APP_ID!,
  environment: 'sandbox' // or 'production' (the default)
});

// Create a payment. Amounts are in laari: 15000 = MVR 150.00.
const tx = await bml.transactions.create({
  amount: toLaari(150),
  currency: 'MVR',
  localId: 'order-1042',
  customerReference: 'Order #1042',
  redirectUrl: 'https://yourshop.mv/orders/1042'
});

// Send the customer to BML's payment page
redirect(tx.url);

// Later: check the status
const latest = await bml.transactions.get(tx.id);
latest.state; // "QR_CODE_GENERATED" | "CONFIRMED" | "CANCELLED" | "REFUND_REQUESTED" | "REFUNDED"

// List all transactions (paginated, pages start at 1)
const { count, items } = await bml.transactions.list({ page: 1 });
```

### Webhooks

Set your webhook URL in the BML merchant dashboard (**Connect → Webhooks**). BML POSTs JSON to it whenever a transaction changes. **Always verify the signature**, since anyone can POST to your URL:

```ts
app.post('/webhooks/bml', async (req, res) => {
  if (!bml.verifyWebhook(req.body)) return res.status(401).end();

  const { transactionId, state, localId } = req.body;
  if (state === 'CONFIRMED') await markOrderPaid(localId);
  res.status(200).end();
});
```

### Errors

API errors throw a `BmlConnectError` with `status`, BML's error `code` (e.g. `PP-xx-xx`) and the raw `body`:

```ts
import { BmlConnectError } from '@ruhlabs/bml-connect';

try {
  await bml.transactions.get('unknown');
} catch (err) {
  if (err instanceof BmlConnectError && err.status === 404) {
    // not found
  }
}
```

## Notes

- Built from BML's published Connect API v2.0 documentation and their official PHP client. This is a community package, not made by Bank of Maldives.
- BML has moved its documentation to a new site. Check the current docs if something behaves differently.

## License

MIT © Ruh Labs

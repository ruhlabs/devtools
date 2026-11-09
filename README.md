# Maavadi

Developer tools for Maldivian developers, by [Ruh Labs](https://github.com/ruhlabs).

| Package | Description |
|---|---|
| [`@ruhlabs/thaana`](packages/thaana) | Latin ↔ Thaana transliteration and Thaana detection |
| [`@ruhlabs/validators`](packages/validators) | Maldivian phone numbers and national ID card numbers |

There's also an [HTTP API](apps/api) that wraps the same packages, for projects that can't use npm.

## Quick start

```bash
npm install @ruhlabs/thaana @ruhlabs/validators
```

```ts
import { toLatin, toThaana } from '@ruhlabs/thaana';
import { parsePhone, isValidNationalId } from '@ruhlabs/validators';

toLatin('ދިވެހިރާއްޖެ'); // "dhivehiraajje"
toThaana('raajje'); // "ރާއްޖެ"

parsePhone('+960 777 1234');
// { national: "7771234", e164: "+9607771234", international: "+960 777-1234", type: "mobile" }

isValidNationalId('A123456'); // true
```

## Development

Requires Node 22+ and pnpm (`corepack enable`).

```bash
pnpm install
pnpm build      # build all packages and the API
pnpm test       # run all tests
pnpm dev:api    # run the API locally on http://localhost:3000
```

### Releasing packages

Packages are versioned with [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset   # describe your change
pnpm changeset version
pnpm release     # build and publish to npm
```

### Deploying the API

The root `Dockerfile` builds the API. In Dokploy, create an Application from this repo with build type **Dockerfile**, and set the domain's container port to `3000`.

## License

MIT © Ruh Labs

# @ruhlabs/validators

Validators and formatters for Maldivian data. No dependencies, works in Node and the browser.

```bash
npm install @ruhlabs/validators
```

## Phone numbers

Accepts all common ways of writing a Maldivian number: `7771234`, `777-1234`, `+960 777 1234`, `00960 7771234` and so on.

```ts
import { parsePhone, isValidPhone, isMobile } from '@ruhlabs/validators';

parsePhone('+960 777 1234');
// {
//   national: "7771234",
//   e164: "+9607771234",          // store this
//   international: "+960 777-1234", // show this
//   type: "mobile"
// }

parsePhone('123'); // null
isValidPhone('777-1234'); // true
isMobile('3321234'); // false (landline)
```

Number types follow current allocations: numbers starting with 7 or 9 are mobile, 3 or 6 are landlines.

## National ID card numbers

```ts
import { isValidNationalId, normalizeNationalId } from '@ruhlabs/validators';

isValidNationalId('A123456'); // true
normalizeNationalId(' a 123-456 '); // "A123456"
normalizeNationalId('B12345'); // null
```

This checks the **format** only (A + 6 digits). It can't tell whether a card exists or who it belongs to. For real identity verification, use eFaas.

## License

MIT © Ruh Labs

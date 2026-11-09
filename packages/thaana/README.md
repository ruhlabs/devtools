# @maavadi/thaana

Thaana (ތާނަ) utilities for JavaScript and TypeScript: Latin ↔ Thaana transliteration and Thaana detection. No dependencies, works in Node and the browser.

```bash
npm install @maavadi/thaana
```

## Usage

```ts
import { toLatin, toThaana, hasThaana, isThaana } from '@maavadi/thaana';

toLatin('ދިވެހިރާއްޖެ'); // "dhivehiraajje"
toLatin('ހުޅުމާލެ'); // "hulhumaale"
toLatin('Hello ދިވެހި!'); // "Hello dhivehi!" (non-Thaana text is kept)

toThaana('dhivehi'); // "ދިވެހި"
toThaana('raajje'); // "ރާއްޖެ"
toThaana('aharen'); // "އަހަރެން"

hasThaana('hello ދިވެހި'); // true
isThaana('ދިވެހި ރާއްޖެ، 2026'); // true
```

## How transliteration works

`toLatin` follows simplified Malé Latin spelling:

- Each letter + fili becomes its Latin spelling (ދި → `dhi`, މާ → `maa`).
- Alifu + sukun (އް) doubles the next consonant (ރާއްޖެ → `raajje`), or becomes `h` at the end of a word (ތިނެއް → `thineh`).
- Arabic punctuation (، ؟ ؛) becomes `, ? ;`.

`toThaana` is **best effort**. Latin spelling is ambiguous (for example `s` could be ސ or ޞ), so it always picks the common Dhivehi letter. It's good for search, suggestions and input helpers. Check the output before showing it as official text.

## License

MIT © Ruh Labs

# @ruhlabs/atolls

The Maldives' 20 administrative atolls and 5 cities as typed data, with lookup and address helpers. No dependencies, works in Node and the browser.

```bash
npm install @ruhlabs/atolls
```

## Usage

```ts
import { ATOLLS, CITIES, getAtoll, parseIslandAddress, formatIslandAddress } from '@ruhlabs/atolls';

getAtoll('Haa Alif');
// {
//   code: "HA", codeThaana: "ހއ", codeName: "Haa Alifu",
//   officialName: "Thiladhunmathi Uthuruburi", latinLetter: "A",
//   iso: "MV-07", capital: "Dhidhdhoo", aliases: ["Haa Alif"]
// }

// Any name or code works: "HA", "ha", "Haa Alif Atoll", "ހއ", "MV-07", "Thiladhunmathi Uthuruburi"
getAtoll('Gaaf Dhaal')?.capital; // "Thinadhoo"

parseIslandAddress('B. Eydhafushi'); // { atoll: { code: "B", ... }, island: "Eydhafushi" }
parseIslandAddress('ބ. އޭދަފުށި'); // works with Thaana codes too

formatIslandAddress('Baa', 'Eydhafushi'); // "B. Eydhafushi"
formatIslandAddress('B', 'އޭދަފުށި', { thaana: true }); // "ބ. އޭދަފުށި"

ATOLLS.map((a) => a.code); // ["HA", "HDh", "Sh", ..., "Gn", "S"], north to south
CITIES; // Malé, Addu, Fuvahmulah, Kulhudhuffushi, Thinadhoo
```

Use it for atoll dropdowns, cleaning up addresses people type in, or showing atolls in Dhivehi.

## Data

Atoll codes, official names, ISO 3166-2 codes and capitals follow Wikipedia's *Administrative divisions of the Maldives* (2026) and ISO 3166-2:MV. Please open an issue if anything has changed.

## License

MIT © Ruh Labs

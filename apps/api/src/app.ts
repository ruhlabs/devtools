import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { ATOLLS, CITIES, getAtoll, parseIslandAddress } from '@ruhlabs/atolls';
import { toLatin, toThaana, hasThaana } from '@ruhlabs/thaana';
import { isValidNationalId, normalizeNationalId, parsePhone } from '@ruhlabs/validators';
import { rateLimit } from './rate-limit.js';

const MAX_TEXT_LENGTH = 5000;

// ---------------------------------------------------------------------------
// Schemas — these drive request validation *and* the generated docs.
// ---------------------------------------------------------------------------

const ErrorSchema = z
	.object({ error: z.string().openapi({ example: 'Missing query parameter "number"' }) })
	.openapi('Error');

const TextQuery = (example: string, description: string) =>
	z.object({
		text: z
			.string()
			.min(1)
			.max(MAX_TEXT_LENGTH)
			.openapi({ example, description: `${description} Up to ${MAX_TEXT_LENGTH} characters.` })
	});

const TransliterationSchema = z
	.object({
		input: z.string().openapi({ example: 'ދިވެހިރާއްޖެ' }),
		output: z.string().openapi({ example: 'dhivehiraajje' })
	})
	.openapi('Transliteration');

const PhoneSchema = z
	.object({
		input: z.string().openapi({ example: '+960 777 1234' }),
		valid: z.boolean().openapi({ example: true }),
		national: z.string().optional().openapi({ example: '7771234', description: '7-digit national number' }),
		e164: z.string().optional().openapi({ example: '+9607771234', description: 'E.164 format, for storing and SMS APIs' }),
		international: z.string().optional().openapi({ example: '+960 777-1234', description: 'Formatted for display' }),
		type: z.enum(['mobile', 'landline']).optional().openapi({ example: 'mobile' })
	})
	.openapi('PhoneValidation');

const NationalIdSchema = z
	.object({
		input: z.string().openapi({ example: 'a123456' }),
		valid: z.boolean().openapi({ example: true }),
		normalized: z.string().nullable().openapi({ example: 'A123456' })
	})
	.openapi('NationalIdValidation');

const AtollSchema = z
	.object({
		code: z.string().openapi({ example: 'HA', description: 'Code used in addresses' }),
		codeThaana: z.string().openapi({ example: 'ހއ' }),
		codeName: z.string().openapi({ example: 'Haa Alifu' }),
		officialName: z.string().openapi({ example: 'Thiladhunmathi Uthuruburi' }),
		latinLetter: z.string().openapi({ example: 'A' }),
		iso: z.string().openapi({ example: 'MV-07', description: 'ISO 3166-2 code' }),
		capital: z.string().openapi({ example: 'Dhidhdhoo' }),
		aliases: z.array(z.string()).openapi({ example: ['Haa Alif', 'North Thiladhunmathi'] })
	})
	.openapi('Atoll');

const CitySchema = z
	.object({
		name: z.string().openapi({ example: 'Addu City' }),
		atoll: z.string().nullable().openapi({ example: 'S', description: 'Atoll code, or null for Malé' }),
		iso: z.string().optional().openapi({ example: 'MV-01' })
	})
	.openapi('City');

const AddressSchema = z
	.object({
		input: z.string().openapi({ example: 'B. Eydhafushi' }),
		valid: z.boolean().openapi({ example: true }),
		island: z.string().optional().openapi({ example: 'Eydhafushi' }),
		atoll: AtollSchema.optional()
	})
	.openapi('ParsedAddress');

const json = <T extends z.ZodType>(schema: T, description: string) => ({
	content: { 'application/json': { schema } },
	description
});

const badRequest = { 400: json(ErrorSchema, 'Missing or invalid parameter') };
const rateLimited = { 429: json(ErrorSchema, 'Rate limit exceeded (120 requests per minute per IP)') };

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const toLatinRoute = createRoute({
	method: 'get',
	path: '/v1/thaana/to-latin',
	tags: ['Thaana'],
	summary: 'Thaana → Latin',
	description: 'Transliterate Dhivehi written in Thaana into Latin script, the way Maldivians type it informally.',
	request: { query: TextQuery('ދިވެހިރާއްޖެ', 'Text in Thaana.') },
	responses: { 200: json(TransliterationSchema, 'Transliterated text'), ...badRequest, ...rateLimited }
});

const toThaanaRoute = createRoute({
	method: 'get',
	path: '/v1/thaana/to-thaana',
	tags: ['Thaana'],
	summary: 'Latin → Thaana',
	description: 'Transliterate Latin-script Dhivehi (e.g. "raajje") into Thaana.',
	request: { query: TextQuery('raajje', 'Dhivehi written in Latin letters.') },
	responses: {
		200: json(TransliterationSchema.openapi({ example: { input: 'raajje', output: 'ރާއްޖެ' } }), 'Transliterated text'),
		...badRequest,
		...rateLimited
	}
});

const phoneRoute = createRoute({
	method: 'get',
	path: '/v1/validate/phone',
	tags: ['Validation'],
	summary: 'Validate a phone number',
	description:
		'Check a Maldivian phone number and normalise it. Accepts spaces, dashes and an optional +960 / 00960 prefix. ' +
		'Numbers starting with 7 or 9 are mobile; 3 or 6 are landline. An invalid number still returns 200 with `valid: false`.',
	request: {
		query: z.object({
			number: z.string().min(1).max(200).openapi({ example: '+960 777 1234', description: 'Phone number in any common format.' })
		})
	},
	responses: { 200: json(PhoneSchema, 'Validation result'), ...badRequest, ...rateLimited }
});

const nationalIdRoute = createRoute({
	method: 'get',
	path: '/v1/validate/national-id',
	tags: ['Validation'],
	summary: 'Validate a national ID card number',
	description: 'Check the format of a Maldivian national ID card number (A followed by 6 digits). This checks the format only, not whether the ID exists.',
	request: {
		query: z.object({
			id: z.string().min(1).max(200).openapi({ example: 'a123456', description: 'ID card number. Case and spaces are ignored.' })
		})
	},
	responses: { 200: json(NationalIdSchema, 'Validation result'), ...badRequest, ...rateLimited }
});

const atollsRoute = createRoute({
	method: 'get',
	path: '/v1/atolls',
	tags: ['Atolls'],
	summary: 'List atolls and cities',
	description: 'All 20 administrative atolls, north to south, plus the cities.',
	responses: {
		200: json(z.object({ atolls: z.array(AtollSchema), cities: z.array(CitySchema) }), 'Atolls and cities'),
		...rateLimited
	}
});

const atollRoute = createRoute({
	method: 'get',
	path: '/v1/atolls/{query}',
	tags: ['Atolls'],
	summary: 'Look up an atoll',
	description: 'Find an atoll by its code (HA, Sh, ADh), code name (Haa Alif), official name or Thaana code.',
	request: {
		params: z.object({
			query: z.string().min(1).max(200).openapi({ example: 'Sh', param: { name: 'query', in: 'path' } })
		})
	},
	responses: { 200: json(AtollSchema, 'The atoll'), 404: json(ErrorSchema, 'No atoll matched'), ...rateLimited }
});

const addressRoute = createRoute({
	method: 'get',
	path: '/v1/address/parse',
	tags: ['Atolls'],
	summary: 'Parse an island address',
	description:
		'Split an island written with its atoll code — "B. Eydhafushi", "HDh Kulhudhuffushi", "ބ. އޭދަފުށި" — into the atoll and island name. ' +
		'Returns 200 with `valid: false` if there is no recognisable atoll code.',
	request: {
		query: z.object({
			island: z.string().min(1).max(200).openapi({ example: 'B. Eydhafushi', description: 'Island with its atoll code in front.' })
		})
	},
	responses: { 200: json(AddressSchema, 'Parse result'), ...badRequest, ...rateLimited }
});

const healthRoute = createRoute({
	method: 'get',
	path: '/health',
	tags: ['Status'],
	summary: 'Health check',
	responses: { 200: json(z.object({ status: z.literal('ok') }), 'The API is up') }
});

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function createApp() {
	const app = new OpenAPIHono({
		// Turn Zod validation failures into the same { error } shape as everywhere else.
		defaultHook: (result, c) => {
			if (!result.success) {
				const issue = result.error.issues[0];
				const field = issue?.path.join('.') || 'request';
				const message =
					issue?.code === 'invalid_type' && issue.input === undefined
						? `Missing query parameter "${field}"`
						: `Invalid "${field}": ${issue?.message ?? 'invalid value'}`;
				return c.json({ error: message }, 400);
			}
		}
	});

	app.use('*', secureHeaders());
	app.use('*', cors());
	app.use('/v1/*', rateLimit({ limit: 120, windowMs: 60_000 }));

	app.get('/', (c) => c.redirect('/docs'));

	app.openapi(healthRoute, (c) => c.json({ status: 'ok' as const }, 200));

	app.openapi(toLatinRoute, (c) => {
		const { text } = c.req.valid('query');
		return c.json({ input: text, output: toLatin(text) }, 200);
	});

	app.openapi(toThaanaRoute, (c) => {
		const { text } = c.req.valid('query');
		if (hasThaana(text)) return c.json({ error: 'Text is already in Thaana' }, 400);
		return c.json({ input: text, output: toThaana(text) }, 200);
	});

	app.openapi(phoneRoute, (c) => {
		const { number } = c.req.valid('query');
		const parsed = parsePhone(number);
		return c.json(parsed ? { input: number, valid: true, ...parsed } : { input: number, valid: false }, 200);
	});

	app.openapi(nationalIdRoute, (c) => {
		const { id } = c.req.valid('query');
		return c.json({ input: id, valid: isValidNationalId(id), normalized: normalizeNationalId(id) ?? null }, 200);
	});

	app.openapi(atollsRoute, (c) => c.json({ atolls: [...ATOLLS].map((a) => ({ ...a, aliases: [...a.aliases] })), cities: [...CITIES] }, 200));

	app.openapi(atollRoute, (c) => {
		const atoll = getAtoll(c.req.valid('param').query);
		return atoll ? c.json({ ...atoll, aliases: [...atoll.aliases] }, 200) : c.json({ error: 'Atoll not found' }, 404);
	});

	app.openapi(addressRoute, (c) => {
		const { island } = c.req.valid('query');
		const parsed = parseIslandAddress(island);
		return c.json(
			parsed
				? { input: island, valid: true, island: parsed.island, atoll: { ...parsed.atoll, aliases: [...parsed.atoll.aliases] } }
				: { input: island, valid: false },
			200
		);
	});

	app.doc31('/openapi.json', {
		openapi: '3.1.0',
		info: {
			title: 'Ruh Labs API',
			version: '1.0.0',
			description:
				'Free developer tools for Maldivian developers, by **Ruh Labs**.\n\n' +
				'Transliterate Thaana, validate phone numbers and ID cards, and look up atolls and island addresses.\n\n' +
				'- No API key needed\n' +
				'- Rate limit: 120 requests per minute per IP\n' +
				'- Prefer a library? The same logic ships on npm as [`@ruhlabs/thaana`](https://www.npmjs.com/package/@ruhlabs/thaana), ' +
				'[`@ruhlabs/validators`](https://www.npmjs.com/package/@ruhlabs/validators) and [`@ruhlabs/atolls`](https://www.npmjs.com/package/@ruhlabs/atolls).\n' +
				'- Source: [github.com/ruhlabs/devtools](https://github.com/ruhlabs/devtools)'
		},
		servers: [{ url: 'https://api.oreotm.xyz', description: 'Production' }],
		tags: [
			{ name: 'Thaana', description: 'Convert between Thaana and Latin script' },
			{ name: 'Validation', description: 'Check and normalise Maldivian identifiers' },
			{ name: 'Atolls', description: 'Administrative atolls, cities and island addresses' },
			{ name: 'Status', description: 'Service health' }
		]
	});

	app.get(
		'/docs',
		Scalar({
			url: '/openapi.json',
			pageTitle: 'Ruh Labs API',
			theme: 'purple',
			layout: 'modern',
			defaultHttpClient: { targetKey: 'js', clientKey: 'fetch' },
			showDeveloperTools: 'never',
			agent: { disabled: true }
		})
	);

	app.notFound((c) => c.json({ error: 'Not found. See /docs for the available endpoints.' }, 404));

	return app;
}

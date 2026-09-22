# @buun_group/gunspec-sdk

> This repository mirrors the SDK's source on every stable release. The package is built and published to npm from the GunSpec monorepo, and each release here is tagged with the version it matches. Issues are welcome here. A pull request is read and applied upstream by hand, then arrives with the next release.

Official TypeScript SDK for the [GunSpec.io](https://gunspec.io) firearms specification database API. Zero runtime dependencies; runs on native `fetch` in Node 18+, Bun, Deno, Cloudflare Workers and browsers.

## Installation

```bash
npm install @buun_group/gunspec-sdk
```

## Quick Start

```typescript
import { GunSpec } from '@buun_group/gunspec-sdk';

// Reads GUNSPEC_API_KEY from the environment
const client = new GunSpec();

const { data, pagination } = await client.firearms.list({ category: 'pistol', manufacturer: 'glock' });
for (const firearm of data) console.log(firearm.name, firearm.version);

const { data: glock } = await client.firearms.get('glock-g17');

// Turn a loose name into an id
const { data: hit } = await client.firearms.resolve('G19 gen 5');
if (hit.status === 'resolved') console.log(hit.firearmId);
```

## Configuration

```typescript
const client = new GunSpec({
  apiKey: process.env.GUNSPEC_API_KEY, // or omit: read from the environment. null = anonymous on purpose
  authScheme: 'x-api-key',             // or 'bearer' for Authorization: Bearer
  baseURL: 'https://api.gunspec.io',   // default
  timeout: 30000,                      // ms
  retry: { maxRetries: 2, initialDelayMs: 500, maxRetryAfterMs: 30000 },
  etagCache: true,                     // hold ETags; a 304 is served locally and costs no daily quota
});
```

Security defaults you get without asking:

- **A key never goes over plain `http://`** to anything but localhost. `new GunSpec({ apiKey, baseURL: 'http://api.example.com' })` throws `ConfigurationError`; pass `allowInsecure: true` only for a private network you trust.
- **The key never appears in an error, a log line or `JSON.stringify(client)`**; it is masked (`gsk_...feca`).
- **`Retry-After` is honoured, and bounded.** A 429 or 503 that asks for a wait longer than `maxRetryAfterMs` is surfaced instead of slept through, and a spent daily allowance (`DAILY_CAP_EXCEEDED`) is never retried.

## Resources

| Resource | Methods |
|----------|---------|
| `client.firearms` | `list`, `get`, `search`, `resolve`, `resolveMany`, `compare`, `gameMeta`, `actionTypes`, `filterOptions`, `random`, `top`, `headToHead`, `byFeature`, `byAction`, `byMaterial`, `byDesigner`, `powerRating`, `timeline`, `byConflict`, `popular`, `getVariants`, `getImages`, `getSchematics`, `getGameStats`, `getDimensions`, `getUsers`, `getFamilyTree`, `getSimilar`, `getAdoptionMap`, `getGameProfile`, `getSilhouette`, `calculate`, `load`, `mediaCatalog`, `listMedia`, `getMedia`, `downloadMedia`, `getImageAsset`, `getModel`, `getOffers`, `getInterfaces`, `getAttachments`, `listAutoPaging` |
| `client.manufacturers` | `list`, `get`, `getFirearms`, `getTimeline`, `getStats`, `listAutoPaging` |
| `client.calibers` | `list`, `get`, `compare`, `ballistics`, `getFirearms`, `getParentChain`, `getFamily`, `getAmmunition`, `listAutoPaging` |
| `client.categories` | `list`, `getFirearms` |
| `client.ammunition` | `list`, `get`, `getBulletSvg`, `ballistics`, `listAutoPaging` |
| `client.attachments` | `list`, `get`, `getFirearms`, `getOffers`, `listAutoPaging` |
| `client.interfaces` | `list`, `getFirearms` |
| `client.platforms` | `list`, `get` |
| `client.vendor` | `shops`, `listOffers`, `pushOffers`, `updateOffer`, `deleteOffer`, `clickUrl`, `resolveClick` |
| `client.stats` | `summary`, `productionStatus`, `fieldCoverage`, `catalogCoverage`, `popularCalibers`, `prolificManufacturers`, `byCategory`, `byEra`, `materials`, `adoptionByCountry`, `adoptionByType`, `actionTypes`, `featureFrequency`, `caliberPopularityByEra` |
| `client.game` | `balanceReport`, `tierList`, `matchups`, `roleRoster`, `statDistribution` |
| `client.gameStats` | `listVersions`, `listFirearms`, `getFirearm` |
| `client.countries` | `list`, `getArsenal` |
| `client.conflicts` | `list` |
| `client.content` | `listChangelog`, `getChangelogEntry`, `listBlogPosts`, `getBlogPost`, `listNotices` |
| `client.collections` | `getShared` |
| `client.dataQuality` | `coverage`, `confidence` |
| `client.favorites` | `list`, `listIds`, `add`, `remove` |
| `client.reports` | `create`, `list` |
| `client.support` | `create`, `list`, `get`, `reply` |
| `client.webhooks` | `list`, `create`, `get`, `update`, `delete`, `test` |
| `client.usage` | `get` |

`client.http` is the underlying `HttpClient` for a path the resources do not cover yet.

### Compatibility

What fits a firearm is computed from mount interfaces, never from names. Browsing the attachment catalog is open on the same terms as firearms; computing a fit is a Studio feature.

```typescript
const { data } = await client.firearms.getAttachments('ak-74m', { category: 'suppressor', with_offers: true });
for (const group of data.groups) {
  for (const item of group.items) console.log(item.name, item.fitType, item.confidence, item.via);
}
```

### Sellers

A shop names an ordinary Enterprise key in Profile > Seller; that mapping is the whole vendor scope. Prices are integer minor units plus an ISO 4217 code: format with `Intl.NumberFormat`, never divide first.

```typescript
const { data: shops } = await client.vendor.shops();
await client.vendor.pushOffers({ offers: [{ sku: 'A1', attachment_id: 'surefire-socom556-rc2', price_cents: 129900, currency: 'AUD', url: 'https://shop.example/a1' }] });
await client.vendor.updateOffer('A1', { price_cents: 119900, status: 'published' });

// Rendering a listing: link through the tracked URL so the seller sees the visit
const { data: offers } = await client.attachments.getOffers('surefire-socom556-rc2', { region: 'AU' });
const href = client.vendor.clickUrl(offers[0].clickId!);
```

### Provenance

A firearm detail, a caliber and an attachment detail carry `provenance`: the pages consulted (`sources`), the 0 to 1 `dataConfidence` set from what was actually sourced, `verifiedAt` and `verifiedFields` for the last check against a maker's page (null means seed knowledge nobody has checked), and the same `updatedAt` and `version` the record carries at the top level. Check a specific figure against `sources`, not against the score.

```typescript
const { data } = await client.firearms.get('glock-g17');
if (data.provenance?.verifiedAt === null) console.log('unverified; sources:', data.provenance.sources);
```

### Evidence on fits

Every fit item (`firearms.getAttachments`, `attachments.getFirearms`) carries `source`, the weakest evidence behind it: `curated` is a person's verdict, `universal` needs no interface at all, and `inferred`, `inherited:parent` or `inherited:platform` name the least trustworthy interface row the fit passed through. Treat `inferred` as unverified; `min_confidence` hides it. `FIT_SOURCES` lists the values, and every other closed vocabulary the API serves (`FIREARM_STATUSES`, `MEDIA_KINDS`, `TICKET_STATUSES` ...) is exported the same way with a matching union type, generated from the API source.

The raw OpenAPI schemas are exported as `components` for callers who want them (`components['schemas']['FirearmRecord']`); the hand-written models are checked against them on every test run.

## Auto-Pagination

```typescript
for await (const firearm of client.firearms.listAutoPaging({ category: 'rifle' })) {
  console.log(firearm.name);
}
```

## Caching and conditional requests

Every response carries `etag`, `cacheControl`, `requestId` and `rateLimit`. Every record carries `updatedAt` (when it changed) and `version` (its content hash: equal versions mean equal data, on every plan).

With `etagCache: true` the SDK sends `If-None-Match` on every GET and serves the held body when the API answers `304`. A 304 does not count against the plan's daily cap.

```typescript
const client = new GunSpec({ etagCache: true });
const a = await client.firearms.get('ak-47'); // 200, stored
const b = await client.firearms.get('ak-47'); // 304, b.fromCache === true, b.data === a.data
```

Pass an `ETagStore` (`get`/`set`) to persist across processes. Keys are namespaced by a fingerprint of the API key, so two keys never share a plan-shaped body. Hold your own tags with `client.http.requestConditional({ method: 'GET', path, ifNoneMatch })`, which returns `{ notModified: true }` on a 304.

## Error Handling

Every API error carries `code` (the family, stable forever) and `reason` (the situation, what to branch on), plus `details`, `retryAfter`, `requestId` and `action`: the API's own one-line advice.

```typescript
import { GunSpec, APIError, AuthenticationError, PermissionError, RateLimitError } from '@buun_group/gunspec-sdk';

try {
  await client.firearms.getAttachments('ak-47');
} catch (error) {
  if (error instanceof PermissionError && error.reason === 'PLAN_REQUIRED') {
    console.log(`Needs ${error.requiredTier}. ${error.action}`);
  } else if (error instanceof RateLimitError) {
    console.log(error.isDailyCap ? 'Daily allowance spent' : `Retry in ${error.retryAfter}s`);
  } else if (error instanceof AuthenticationError) {
    console.log(error.reason); // KEY_MISSING | KEY_INVALID | KEY_DISABLED | KEY_EXPIRED | ...
  } else if (error instanceof APIError) {
    console.log(error.status, error.reason, error.requestId);
  }
}
```

401 is a credential problem: a different key can work. 403 is a permission: reissuing a key changes nothing. Subclasses: `BadRequestError` (400), `AuthenticationError` (401), `PermissionError` (403), `NotFoundError` (404), `ConflictError` (409), `PayloadTooLargeError` (413), `RateLimitError` (429), `InternalServerError` (500), `ServiceUnavailableError` (503); `ConnectionError`, `TimeoutError` and `ConfigurationError` never reached the API. `ERROR_REASONS` exports every reason with its summary and action.

## Webhooks

Verify deliveries before trusting them. The header is `X-Webhook-Signature: t=<unix>,v1=<hex>`, HMAC-SHA256 over `${t}.${rawBody}` with the endpoint secret.

```typescript
import { constructWebhookEvent, WebhookSignatureError } from '@buun_group/gunspec-sdk';

app.post('/hooks/gunspec', async (req, res) => {
  try {
    const event = await constructWebhookEvent(await req.text(), req.headers.get('X-Webhook-Signature'), process.env.GUNSPEC_WEBHOOK_SECRET);
    if (event.type === 'firearm.updated') await mirror.upsert(event.data);
    res.status(204).end();
  } catch (e) {
    if (e instanceof WebhookSignatureError) return res.status(400).end();
    throw e;
  }
});
```

Pass the body **as received**; re-serialising a parsed object breaks the HMAC. Dedupe on `X-Webhook-Id` (the event), quote `X-Webhook-Delivery` (the attempt) to support. `WEBHOOK_EVENT_TYPES` lists every subscribable event.

## Tool manifest (agents)

`@buun_group/gunspec-sdk/tools` restates the read-only surface as tools: a stable name, a model-facing description, a JSON Schema for the arguments, the plan it needs, and `execute(client, args)`. Adapters render it for Anthropic (`asAnthropicTools`), OpenAI (`asOpenAITools`) and MCP (`asMcpTools`); `toolsForTier` hides what a plan cannot reach.

```typescript
import { GunSpec } from '@buun_group/gunspec-sdk';
import { asAnthropicTools, executeTool } from '@buun_group/gunspec-sdk/tools';

const tools = asAnthropicTools();
const result = await executeTool(new GunSpec(), 'gunspec_get_firearm', { id: 'ak-47' });
```

### Workflows

Five tools make several SDK calls and return one compact, combined answer, so an agent spends one turn where it would otherwise spend several. They are listed first in `GUNSPEC_TOOLS` and exported together as `WORKFLOW_TOOLS`.

| Tool | Plan | Most requests | Replaces |
|---|---|---|---|
| `gunspec_identify_firearm` | Builder | 4 | resolve, get, variants, media |
| `gunspec_compare_by_name` | Builder | 6 (up to 5 names) | one resolve per name, compare |
| `gunspec_what_fits` | Studio | 2 | resolve, attachments with offers |
| `gunspec_cartridge_profile` | Explorer | 5 | caliber get or search, firearms, family, ammunition |
| `gunspec_load_compare` | Builder | 9 (up to 8 loads) | ammunition list, one ballistics call per load |

```typescript
const identified = await executeTool(new GunSpec(), 'gunspec_identify_firearm', { name: 'Glock 17' });
```

Three rules hold for every workflow:

- **Every request still counts.** A workflow saves the model's turns, not API requests: each call it makes is metered against your plan like a direct one, up to the figure in the table.
- **A name is never guessed.** One that matches several records, or none, comes back `resolved: false` with the candidates rather than an answer about the first match.
- **A missing plan is a gap, not a failure.** An optional step your plan does not cover is listed in `gaps` with the plan it needs, and the rest of the answer still stands.

## Development

```bash
pnpm test                    # unit suite, no network
pnpm sync:contracts          # regenerate error reasons, webhook events and vocabularies from the API source
pnpm generate:types          # regenerate src/types/generated from apps/api/openapi.json
pnpm typecheck               # the source, plus the type-level mirror test against the generated spec
pnpm test:integration        # against a live API; skipped unless the two variables below are set
```

The integration suite runs against the local worker (`pnpm dev:api`, port 8788) with the enterprise dev key that `pnpm --filter @gunspec/api db:seed:dev-key` creates:

```bash
GUNSPEC_INTEGRATION_BASE_URL=http://localhost:8788 GUNSPEC_INTEGRATION_API_KEY=dev-internal-key pnpm test:integration
```

It asserts shapes, never catalog figures, and cleans up what it writes.

## Requirements

- Node.js >= 18 (or any runtime with `fetch` and WebCrypto)
- TypeScript >= 5.0 for type-checking; not required at runtime

## License

MIT

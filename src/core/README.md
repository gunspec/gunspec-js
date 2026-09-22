# sdk/src/core

Transport and cross-cutting machinery every resource class is built on: the fetch wrapper, auth headers, the error hierarchy, retry, pagination, the conditional-request cache, and webhook signature verification. Zero runtime dependencies; everything here runs on native `fetch` and WebCrypto so one build serves Node 18+, Workers, Deno, Bun and browsers.

Governed by: [`packages/sdk/README.md`](../../README.md) (public surface), type-driven-design.

## Contents

| File | Purpose |
|---|---|
| `http-client.ts` | `HttpClient`: URL build, auth, timeout, envelope unwrap, error mapping, retry, ETag cache, raw and conditional requests, redirect following that keeps the key on the base origin, redirect resolution |
| `auth.ts` | Resolve the key (option, then `GUNSPEC_API_KEY`), build `X-API-Key` or `Authorization: Bearer`, refuse a key over plain http to a remote host, mask a key for logs |
| `errors/` | `GunSpecError` and the `APIError` family, one subclass per status the API documents, each carrying `code`, `reason`, `details`, `retryAfter`; factory and status defaults beside them (see its README) |
| `types.ts` | `HttpClientConfig`, `RequestConfig`, the response shapes and `QueryValue`; imported by every resource without pulling the client in |
| `retry.ts` | Exponential backoff on idempotent methods; honours `Retry-After`, never retries a spent daily cap, refuses to sleep past `maxRetryAfterMs` |
| `etag-cache.ts` | `ETagStore` contract and the in-memory LRU; cache keys are namespaced by a SHA-256 credential fingerprint so two keys cannot share a tier-shaped body |
| `subtle.ts` | `loadSubtle`: WebCrypto from `globalThis.crypto`, or `node:crypto` on Node 18 |
| `webhook-signature.ts` | `verifyWebhookSignature` / `constructWebhookEvent` over `X-Webhook-Signature: t=..,v1=..`, constant-time compare, replay tolerance |
| `pagination.ts` | `Page<T>` with `hasNextPage`, `getNextPage` and an async iterator |
| `request-builder.ts` | Query serialisation and URL assembly |
| `path.ts` | `pathSegment`: encode an id as one path segment and refuse `''`, `.` and `..`, which would change the endpoint |
| `response.ts` | Rate-limit, request-id and cache header parsing; envelope parsing that names the mistake when a binary endpoint is read as JSON |
| `signals.ts` | Compose a timeout signal with the caller's `AbortSignal` |
| `index.ts` | Barrel |

## Rules

- **The key never lands on an error, a log line or a cache key.** Errors carry `requestId` and `reason`; the cache key carries a non-reversible fingerprint.
- **The key is an ES private field.** `util.inspect` and `console.log` print the masked view from `toJSON`; a plain property printed the key in full.
- **Redirects are followed here, never by `fetch`.** The fetch standard strips `Authorization` on a cross-origin hop but not `X-API-Key`, so each hop is fetched with `redirect: 'manual'` and carries the key only to the base URL's origin.
- **`reason` is always populated.** When the API sends none, `createAPIError` falls back to the status default the API itself uses, so a `switch` never meets `undefined`.
- **A 304 is a success.** With `etagCache` on, the held body is returned with `fromCache: true`; the caller never sees the 304, and the request did not count against their daily cap.
- **Raw endpoints go through `requestRaw`.** An SVG or GLB parsed as an envelope used to surface as `undefined` data; `parseEnvelope` now throws with the method to use instead.

# sdk/src/core/errors

The error hierarchy, split by where an error comes from. Everything extends `GunSpecError` in `base.ts`; a `catch` on that class sees every error the SDK throws.

| File | Purpose |
|---|---|
| `base.ts` | `GunSpecError`, prototype-safe root |
| `api.ts` | `APIError` and one subclass per documented status (400, 401, 403, 404, 409, 413, 429, 500, 503), each carrying `code`, `reason`, `details`, `retryAfter`, `requestId`, `action` |
| `transport.ts` | `ConnectionError`, `TimeoutError`, `ConfigurationError`: no API answer was involved |
| `reasons.ts` | `defaultReasonFor(status)`, the API's own fallback table |
| `factory.ts` | `createAPIError` from a status, body and headers; `parseRetryAfter` |
| `index.ts` | Barrel; import from `../errors` |

**`instanceof` works across copies of the SDK.** The package has two entries (`.` and `./tools`) built separately, so one process can hold two copies of these classes. Each error records its lineage under `Symbol.for('@buun_group/gunspec-sdk/error-lineage')` and `GunSpecError[Symbol.hasInstance]` checks it, so a new class must declare `static override readonly brand` with its own name. Without it, the tool workflows' `instanceof APIError` never matched an error from the client and a refused optional step failed the whole workflow (`tests/unit/core/errors-across-copies.test.ts`).

Rules: constructor signatures of the subclasses stay positional-compatible with 0.1 (`extra` is a trailing optional); `reason` is always populated; the API key is never a field.

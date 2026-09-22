# sdk/tests

Two suites. `unit/` mocks the transport and never touches the network; it is what `pnpm test` runs. `integration/` runs against a live API and skips itself unless `GUNSPEC_INTEGRATION_BASE_URL` and `GUNSPEC_INTEGRATION_API_KEY` are set; `pnpm test:integration` is the entry point and the package README says how to point it at the local worker.

| Path | Purpose |
|---|---|
| `helpers/mock-client.ts` | A `vi.fn()` stand-in for `HttpClient` plus response factories; every resource test uses it |
| `helpers/keys.ts` | The fixture keys; none was ever issued. Import one rather than writing a literal, which the commit hook refuses |
| `unit/core/` | Transport, auth, errors, retry, ETag cache, webhook signatures: the parts with logic |
| `unit/resources/` | One file per resource: the method builds the right path, forwards params, encodes ids |
| `unit/contracts.test.ts` | Fails when the generated error-reason or webhook-event lists lag the API source |
| `unit/tools.test.ts` | The agent tool manifest: names, schemas, dispatch, adapters |
| `integration/local-api.test.ts` | Shapes, caching, errors and the seller write path against a real API; cleans up what it writes |

Rules: assert shapes, never catalog figures; no key literal in any file (a hook blocks `apiKey: '...'` style strings); tests that need a keyless call pass `apiKey: null` because the developer shell exports a real key.

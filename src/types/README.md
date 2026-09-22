# sdk/src/types

Every public type: models the API returns, parameters the endpoints take, and the two contract lists the API publishes and clients branch on. Types only, apart from the generated constants.

Governed by: [`../README.md`](../README.md), type-driven-design.

## Contents

| File | Purpose |
|---|---|
| `models/` | Catalog, statistics, game, account and content models, one file per area (see its README) |
| `api/` | Query and body parameter interfaces, mirroring `apps/api/src/schemas/`, one file per area (see its README) |
| `compat.ts` | Attachment compatibility: standards, platforms, interfaces, fits, public offers |
| `seller.ts` | Vendor shops and the seller's own offer rows and inputs |
| `media.ts` | Media assets, the media catalog, name resolution results, site notices |
| `errors.ts` | The error envelope shape |
| `error-reasons.ts` | **Generated.** `ErrorReason` union and the API's summary and action for each |
| `webhook-events.ts` | **Generated.** `WEBHOOK_EVENT_TYPES` and its union |
| `vocabulary.ts` | **Generated.** Every closed vocabulary (`FIREARM_STATUSES`, `FIT_SOURCES` ...) as a const and a union; the hand models use the unions |
| `generated/` | **Generated.** `openapi.d.ts` from `apps/api/openapi.json`, the spec the hand models are checked against (see its README) |
| `index.ts` | Barrel |

## Rules

- **Generated files come from `scripts/sync-api-contracts.mjs`** (reasons, events, vocabulary) **and `scripts/generate-openapi-types.mjs`** (`generated/`). Edit the API source, run `pnpm sync:contracts` or `pnpm generate:types`, commit both. `tests/unit/contracts.test.ts` and `tests/unit/generated-types.test.ts` fail when a copy is stale.
- **A hand model mirrors its spec schema exactly.** `tests/unit/types-mirror.test-d.ts` checks each model against `components['schemas']` for the same response: same keys, same value types. Where the spec disagrees with the model, the model is wrong; where the spec under-describes the API (documented in that file), fix the spec in `apps/api/src/openapi/`.
- **Enumerated fields use the `vocabulary.ts` unions**, never an inline literal union, so a value the API adds reaches every model in one regeneration.
- **Null means the API sends null.** Optional (`?`) means the field is absent on some plans; both are stated as the schema states them.
- **Money is integer minor units plus an ISO 4217 code.** Never a float, never divided before formatting.

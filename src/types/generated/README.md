# sdk/src/types/generated

**Generated. Do not edit by hand.** `openapi.d.ts` is what `openapi-typescript` produces from `apps/api/openapi.json`; `openapi.sha256` is the hash of the spec it was built from.

Governed by: [`../README.md`](../README.md), [`../../../README.md`](../../../README.md).

| File | Purpose |
|---|---|
| `openapi.d.ts` | `paths`, `operations` and `components` for every published endpoint |
| `openapi.sha256` | sha256 of the spec the types were generated from |
| `index.ts` | Re-exports `components`, `paths`, `operations` and the `Schema<Name>` helper; the package barrel publishes `components` and `Schema` only |

## Regenerating

```bash
pnpm generate:types          # rewrite from ../../apps/api/openapi.json
pnpm generate:types:check    # exit 1 when the spec has moved on (what the test suite runs)
```

The API regenerates `openapi.json` from `apps/api/src/openapi/`; after that, run `pnpm generate:types` here and commit both. `tests/unit/generated-types.test.ts` fails with "run generate:types" when the hash no longer matches, and `tests/unit/types-mirror.test-d.ts` fails when a hand-written model and the generated schema for the same response disagree, which is the point: the hand model is what a caller reads, the generated one is what the API promises, and the test is what keeps them the same.

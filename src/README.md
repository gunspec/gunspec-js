# sdk/src

Source of `@buun_group/gunspec-sdk`. One `GunSpec` class exposes a resource object per API tag; every resource is a thin typed wrapper over the transport in `core/`, and `tools/` restates the safe subset of the surface as a declarative tool manifest for agents.

Governed by: [`packages/sdk/README.md`](../README.md), type-driven-design.

## Contents

| Path | Purpose |
|---|---|
| `client.ts` | `GunSpec` class and `ClientOptions`; wires every resource to one `HttpClient` |
| `index.ts` | Public barrel: client, core, errors, resources, every type |
| `version.ts` | `VERSION`, bumped with `package.json` |
| `core/` | Transport, auth, errors, retry, pagination, ETag cache, webhook verification |
| `resources/` | One class per API tag |
| `types/` | Models, parameters, and the two generated contract lists (error reasons, webhook events) |
| `tools/` | Tool manifest: name, description, JSON Schema input and an `execute` over the client, for MCP and function-calling hosts |

## Rules

- **Resources hold no logic.** A method builds a path, forwards params, names the return type. Anything cleverer lives in `core/`.
- **Generated files are regenerated, never edited.** `scripts/sync-api-contracts.mjs` reads the API source; `pnpm sync:contracts:check` fails the tests when a copy is stale.
- **Tiers are stated in the doc comment** (`Builder.`, `Studio.`) and match the route's gate in `apps/api`. The docs site is generated from the spec, so the comment is for the reader of the `.d.ts`.

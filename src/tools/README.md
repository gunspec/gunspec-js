# sdk/src/tools

The API restated as a manifest of read-only tools for agent hosts: each entry has a stable name, a model-facing description, a hand-written JSON Schema for its arguments, the plan it needs, and an `execute` over the `GunSpec` client. `@buun_group/gunspec-mcp` is a thin adapter over this list; so is anything built with `asAnthropicTools()` or `asOpenAITools()`.

Governed by: [`../README.md`](../README.md), `apps/assets/public/ai/README.md` (the agent packs that describe the same surface in prose).

## Contents

| File | Tools |
|---|---|
| `types.ts` | `ToolDefinition`, the JSON Schema subset, `defineTool`, shared `PAGE` / `PER_PAGE` / `SLUG` fragments |
| `catalog.ts` | Firearms: search, resolve, list, get, compare, similar, variants, media, top |
| `reference.ts` | Manufacturers, calibers, categories, ammunition, stats summary, changelog |
| `compat.ts` | Attachments, what fits what, mount standards, platforms, where to buy |
| `docs.ts` | How to call the API: an operation's parameters, plan and failures, the printed sample in a language, plan limits. Plus the guides themselves - search them, read one section - which is where the advice lives rather than the declarations. Explorer, answered from `/v1/docs` |
| `workflows/` | Multi-call workflows (identify, compare by name, what fits, cartridge profile, load compare); see its README |
| `index.ts` | `GUNSPEC_TOOLS`, `getTool`, `executeTool`, `toolsForTier`, and the Anthropic / OpenAI / MCP adapters |

## Rules

- **Read-only, and it says so.** Every tool sets `readOnly: true` and the MCP adapter passes it through as `readOnlyHint`. Account and seller writes are deliberately not tools: an agent that can push prices to a storefront needs a human in front of it, not a manifest entry.
- **Names are a contract.** `gunspec_` prefix, snake_case, never renamed. A host's saved prompt may name one.
- **No schema library.** The JSON Schema is written by hand in the subset `types.ts` allows, so the manifest is serialisable as-is and adds no dependency. The API validates the values; the schema is for the model.
- **Counts come from `gunspec_stats_summary`.** No description quotes a number of firearms.
- **Workflows declare `steps` and `maxCalls`.** Every request a workflow makes still counts against the plan; see `workflows/README.md`.
- **Every tool declares an `example`.** Real ids the catalog holds. The docs print it as the tool's example call and the hosted MCP server's nightly check calls each tool with it; `tests/unit/tools.test.ts` holds it to the tool's own schema.
- **Offers carry `href`.** The offer tools attach the tracked outbound link so a host that renders a listing links through `/v1/out/{clickId}` and the seller sees the visit.

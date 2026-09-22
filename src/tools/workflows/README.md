# sdk/src/tools/workflows

Workflows: tools that make several SDK calls and return one combined, compact answer, so an agent spends one turn where it would otherwise spend several. Listed before the single tools in `GUNSPEC_TOOLS`, served by the MCP server unchanged, and documented and verified like every other tool.

Governed by: [`../README.md`](../README.md).

## Rules

- **Every API request still counts.** A workflow saves the model's turns and tokens, not requests: each call it makes is metered against the plan and the MCP allowance like a direct request. `maxCalls` is the most one call can make; it is published on the docs, and `tests/unit/workflows.test.ts` runs every workflow with its widest input and fails if it exceeds the figure or calls a method its `steps` do not declare.
- **`tier` is the tier of the required steps.** An `optional` step the caller's plan does not cover becomes an entry in `gaps` (`step`, `reason`, `requiredTier`) and the answer still stands. `scripts/generate-mcp-reference.mjs` fails the build when a workflow's tier differs from its required steps' highest gate.
- **Never guess a record.** A name that resolves to more than one record, or none, returns `resolved: false` with candidates. Describing the first candidate would attribute every figure to a firearm the user may not have meant.
- **Bound the fan-out.** Anything that calls once per item caps the items (`compare_by_name` 5 names, `load_compare` 8 loads) so a request cannot become an unbounded burst.
- **Summaries by default.** Project the fields a question is usually about; `detail: 'full'` where more is useful.

## Contents

| File | Workflow | Replaces |
|---|---|---|
| `identify-firearm.ts` | `gunspec_identify_firearm` | resolve, get, variants, media |
| `compare-by-name.ts` | `gunspec_compare_by_name` | one resolve per name, compare |
| `what-fits.ts` | `gunspec_what_fits` | resolve, attachments (with offers) |
| `cartridge-profile.ts` | `gunspec_cartridge_profile` | caliber get or search, firearms, family, ammunition |
| `load-compare.ts` | `gunspec_load_compare` | ammunition list, one ballistics call per load |
| `shared.ts` | Optional steps into gaps, unresolved candidates, `detail`, offer links |
| `index.ts` | `WORKFLOW_TOOLS` |

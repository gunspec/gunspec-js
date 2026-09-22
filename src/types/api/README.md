# sdk/src/types/api

Query and body parameter interfaces, one file per area, mirroring `apps/api/src/schemas/`. `index.ts` re-exports every file and `types/index.ts` lists the public names.

| File | Parameters for |
|---|---|
| `shared.ts` | `PaginationParams` and the common path params |
| `firearms.ts` | Every `/v1/firearms*` list, discovery and silhouette endpoint |
| `catalog.ts` | Manufacturers, calibers, ammunition, countries, conflicts |
| `stats.ts` | Statistics and data quality |
| `game.ts` | Game endpoints and snapshots |
| `account.ts` | `/v1/me/*` bodies and filters |

Compatibility, seller and media parameters live beside their models in `../compat.ts`, `../seller.ts` and `../media.ts`.

# sdk/src/types/models

Domain models the API returns, split by area. `index.ts` re-exports every file and `types/index.ts` lists the public names.

| File | Models |
|---|---|
| `firearm.ts` | `Firearm`, `FirearmListItem`, `FirearmDetail`, `FirearmCaliberEntry`, `FirearmVariant` |
| `firearm-relations.ts` | `FirearmImage`, `FirearmUser` |
| `firearm-analysis.ts` | Comparisons, head-to-head, family tree, similar, adoption map, top, power rating, timeline, dimensions, filter options |
| `catalog.ts` | Manufacturers, calibers, categories, countries, conflicts |
| `ammunition.ts` | Loads and ballistic profiles |
| `game.ts` | Game stats, game endpoints, snapshots |
| `stats.ts` | Statistics and data quality |
| `shared.ts` | Pagination and response wrappers |
| `account.ts` | Favorites, reports, support, webhooks, usage, content, collections |
| `provenance.ts` | `Provenance`: sources, confidence and verification state on a firearm, caliber or attachment detail |

Cross-references are `import type` between siblings; nothing here has a runtime footprint.

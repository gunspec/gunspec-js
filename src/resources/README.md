# sdk/src/resources

One class per API tag, each a thin typed wrapper: build the path, forward the params, name the return type. No retries, parsing or auth here; that is `core/`.

Governed by: [`packages/sdk/README.md`](../../README.md), [`../README.md`](../README.md).

## Contents

| File | API tag | Notes |
|---|---|---|
| `firearms.ts` + `firearms/` | Firearms, Firearm Discovery, Firearm Analysis | Class delegates to `firearms/collection.ts` (lists), `firearms/single.ts` (one record), `firearms/extras.ts` (resolve, media, offers, compatibility) |
| `manufacturers.ts` | Manufacturers | |
| `calibers.ts` | Calibers | |
| `categories.ts` | Categories | |
| `ammunition.ts` | Ammunition | `getBulletSvg` reads text, not an envelope |
| `stats.ts` | Statistics | |
| `game.ts` | Game | |
| `game-stats.ts` | Game Stats | |
| `countries.ts`, `conflicts.ts` | Countries, Conflicts | |
| `content.ts` | Content | Changelog, blog, site notices; no key needed |
| `docs.ts` | Content | The reference as data: operations, printed samples with their last check, plan limits; any key, Explorer included |
| `collections.ts` | Collections | Shared collections by share id |
| `attachments.ts` | Compatibility | Catalog is open; `fits=` and `getFirearms` are Studio |
| `interfaces.ts`, `platforms.ts` | Compatibility | Mount vocabulary and platform families |
| `vendor.ts` | Seller | Read, push, patch, withdraw your own offers; `clickUrl` builds the tracked outbound link |
| `data-quality.ts` | Data Quality | Enterprise |
| `favorites.ts`, `reports.ts`, `support.ts`, `webhooks.ts`, `usage.ts` | Account | `/v1/me/*`, key must be linked to an account |
| `index.ts` | | Barrel |

## Rules

- **`firearms.ts` is over the ~300-line guide on purpose.** It is one concern, the `FirearmsResource` class, and every method is a one-line delegation under its doc comment; the logic already lives in `firearms/`. Splitting the class would cost the reader a single `client.firearms.` completion list.

- **Ids are always `encodeURIComponent`-ed.** Interface standard ids carry colons and slashes.
- **Params are passed through untouched.** The API validates; a wrong value is a 400 with `details`, not a silent default.
- **Binary endpoints use `getText` / `getBytes`.** An envelope parse of an SVG is a thrown `GunSpecError` naming the right method.

## The TSDoc is published

`scripts/generate-sdk-reference.mjs` reads these files and the docs site renders the result: every method's first paragraph is its description on docs.gunspec.io, and its first `@example` is the TypeScript sample. So a comment here is published twice - on the website and on hover in the reader's editor - and the two cannot disagree, which is the point. The docs used to restate all of this by hand and had drifted to 51 of 131 methods, two of which did not exist.

Three things follow for anyone adding a method:

- **Write the doc comment.** An undocumented method still renders, falling back to the OpenAPI operation's description, which describes the endpoint rather than the call.
- **The generator must be able to see the endpoint.** It reads the literal path passed to the HTTP client, following a delegation to `firearms/*.ts` or to a sibling method. Where it cannot - a URL built somewhere else - say so with `@endpoint GET /v1/...`, or `@sdkOnly` for a method that makes no request. Anything else fails the build, which is what stops a new call being quietly absent from the reference.
- **Regenerate**: `pnpm generate:stats`. CI fails when the committed reference is stale.

# Changelog

All notable changes to `@buun_group/gunspec-sdk`. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the package follows [Semantic Versioning](https://semver.org/).

## 0.16.0 (2026-10-09)


### Added

* a daily release radar and a Releases tab in Redback (5c96b35)
* a release ledger and GET /v1/releases for new firearm models (71b1120)
* a task the catalogue fixed shows what fixed it, and the page reads better (b4bb6da)

## 0.15.0 (2026-10-06)


### Added

* the filter bar draws each firearm type by a render, and the pistol example is a real record (6765369)

## 0.14.1 (2026-10-04)


### Fixed

* responses stop carrying console columns, and the spec says which fields are conditional (9452b45)
* **sdk:** the examples compare a firearm that production still serves (aa7bd93)

## 0.14.0 (2026-10-04)


### ⚠ BREAKING CHANGES

* firearm images default to the full-size WebP

### Added

* a completed-work page and each method's findings, from closed and open tasks (2d24be3)
* a contract operation can say what it asks (a9b995a)
* a fitment suite that asks the live API what fits, published nightly (1431420)
* a statistical anomaly suite asks for verification of figures unusual among comparable guns (5b1e655)
* abuse holds, monthly limits, edge blocking, Google reports and the staff pages for them (680c46f)
* an integrity check that finds invented data, and a fixer that removes it (e1306bc)
* blog redesign, reader comments and bylines, and the site's scrambled photo route (1367dbd)
* by-feature rows give each feature's icon as its CDN URL (cfe3eed)
* by-feature rows name the icon for each of their features (015e337)
* data checks that publish what is wrong with the catalogue and what was fixed (679c9c6)
* endpoint credits, staff leaderboard, and social cards drawn ahead of time (b7a3117)
* every data task has a number, and a value under review says so on the website (7c4eabf)
* feature icons in the API, on firearm records and as a catalogue (24c16ee)
* firearm figures are compared with a second, independent source (eabd1df)
* firearm images default to the full-size WebP (b961a4d)
* GunSpec Research, papers on the catalogue with a site, an editor and Quill (d2808f9)
* load-carriage endpoint, the metabolic cost of marching with each firearm (280f8f3)
* mass checks read sourced densities, and the check pages lead with their method (ed1e425)
* plausibility and cartridge checks, in the docs, the laptop run and the workflow (4ddeae4)
* question-led studies with open-access literature, live study runs, and peer_reviewed sources (90edb81)
* Quill, the agent that drafts blog posts from the catalogue's figures (d0344e8)
* recoil, point-blank and ammo-load analyses, and agent runs as a page with a timeline and a chat (db7a61b)
* record pages show each source's kind, rank and registry standing (919b3de)
* records publish how far they are backed and every check they went through (a239116)
* records say when they cite their own maker, and the source list grows from use (6962386)
* redback verifies a firearm's figures against its own maker's page (4fce474)
* review marks say how a value breaks its check, and trajectory points show their working (1386430)
* scoped catalogue search, suggestions, home contents strip, generated samples (ecc5bff)
* **sdk:** types for the new search filters, task numbers and research inputs (ad8c6f2)
* sources ranked with signal bars and kind icons, served to Redback at /v1/data/sources (282cad2)
* staff reaches the API through StaffEntrypoint; blog and staff drop the secret (7af4ea8)
* task research, decisions, search and Redback activity in the API (a86d6dc)
* the catalogue repository and Redback's queue sync both ways through a GitHub App (cce0bb8)
* the reference-photo finder searches more providers and counts each key's allowance (c091531)


### Fixed

* a head-to-head names no winner for a figure only one firearm states (06d07be)
* accepted verifications are read from a public list, not with a staff token (ede3d7d)
* catch contradicting measurements and stop compare handing ties to the first firearm (acb4409)
* describe the last undescribed fields in the spec (84722b6)
* SDK types carry the spec's provenance, routes, author and verified fields (7a075cc)
* spec, SDK and docs examples name records that exist (5e15d91)
* task and finding lists carry the standard pagination block (6277eea)
* the site update example names a post that is published (49eb953)
* trajectories read drop from the line of sight, through one standard atmosphere (b38b24d)

## 0.13.1 (2026-09-22)


### Fixed

* **sdk,sdk-python:** the models carry the fields the API now serves (925ad51)

## 0.13.0 (2026-09-22)


### Added

* a call earns experience, and the account can read its own log (e4628f1)
* a call earns experience, and the account has a level (cc22aa9)
* breadth, counted by the nightly job rather than by every request (0b7f943)
* build apps/site, serve ten fields as arrays, enforce the craft rules (bcec6f3)
* give the MCP the docs, report the daily allowance, retire three web pages (a5638f8)
* publish dated updates, and give the reasoning a page of its own (e7f1e80)
* publish twenty-five system checks, and give ammunition a change token (ecd0b4c)
* the standing reports days called and the run of them (7f6e64f)

## 0.12.0 (2026-09-18)


### Added

* a status badge of our own, and a badges section for directories (7beb38f)
* a system token that only works through the MCP server (958eb95)

## 0.11.2 (2026-09-17)


### Fixed

* document assignedTo on the public data task list (9d42cd5)

## 0.11.1 (2026-09-17)


### Fixed

* API sample runs survive a closed data task, and print a live blog post (2cbaddf)
* SDK example runs report unreleased methods, and print values production serves (097c5b6)

## 0.11.0 (2026-09-17)


### Added

* **sdk:** MCP tools that answer how to call the API from the reference (2ef0007)
* serve the API reference to code at /v1/docs (febef92)


### Fixed

* document GET /v1/data/tasks/summary, and test the docs resources in both SDKs (e17812f)
* require an Explorer key for /v1/docs (bccd31b)
* **sdk:** MCP examples name records whose media is populated (99b98ed)
* **sdk:** say which plan an MCP tool needs end to end, and what its arguments are sent as (196fce7)

## 0.10.0 (2026-09-17)


### Added

* add MCP example usage and hold printed answers to the live server (4fb0637)
* **sdk:** give every MCP tool the plain questions it answers (cfb93ae)


### Fixed

* **sdk:** instanceof on SDK errors works across the client and tools entries (e708c1e)

## 0.9.0 (2026-09-17)


### Added

* add MCP example usage and hold printed answers to the live server (4fb0637)
* **sdk:** give every MCP tool the plain questions it answers (cfb93ae)


### Fixed

* **sdk:** instanceof on SDK errors works across the client and tools entries (e708c1e)

## 0.8.3 (2026-09-17)


### Fixed

* **sdk:** instanceof on SDK errors works across the client and tools entries (e708c1e)

## 0.8.2 (2026-09-17)


### Fixed

* **sdk:** instanceof on SDK errors works across the client and tools entries (e708c1e)

## 0.8.1 (2026-09-17)


### Fixed

* **sdk:** instanceof on SDK errors works across the client and tools entries (e708c1e)

## 0.8.0 (2026-09-17)


### Added

* publish whether the reference is still true, and run the cURL samples (7803ed0)
* **sdk:** workflow tools, MCP usage and manufacturer status in both SDKs (eefc1c2)


### Fixed

* **sdk:** correct BlogPost to the shape /v1/blog sends (0535cc6)
* **sdk:** instanceof on SDK errors works across the client and tools entries (e708c1e)

## 0.7.0 (2026-09-17)


### Added

* publish whether the reference is still true, and run the cURL samples (7803ed0)
* **sdk:** workflow tools, MCP usage and manufacturer status in both SDKs (eefc1c2)


### Fixed

* **sdk:** correct BlogPost to the shape /v1/blog sends (0535cc6)
* **sdk:** instanceof on SDK errors works across the client and tools entries (e708c1e)

## 0.6.0 (2026-09-17)


### Added

* publish whether the reference is still true, and run the cURL samples (7803ed0)
* **sdk:** workflow tools, MCP usage and manufacturer status in both SDKs (eefc1c2)


### Fixed

* **sdk:** correct BlogPost to the shape /v1/blog sends (0535cc6)
* **sdk:** instanceof on SDK errors works across the client and tools entries (e708c1e)

## 0.5.1 (2026-09-17)


### Fixed

* **sdk:** instanceof on SDK errors works across the client and tools entries (e708c1e)

## 0.5.0 (2026-09-17)


### Added

* **sdk:** workflow tools, MCP usage and manufacturer status in both SDKs (eefc1c2)

## 0.4.0 (2026-09-13)


### Added

* publish whether the reference is still true, and run the cURL samples (7803ed0)

### Changed

- **`BlogPost` was corrected to what `GET /v1/blog` actually returns.** It was typed `{ id: number, excerpt, heroImageUrl, publishedAt }`, none of which the API has ever sent: the endpoint selects a fixed column list off `blog_posts`, where the id is text and those three fields are named `summary`, `heroImage` and `postedAt`. Reading any of them returned `undefined`. The model now also carries `category`, `status`, `createdAt` and `updatedAt`, which the endpoint has always included. A breaking change to the type rather than to the payload: the bytes are unchanged, so only the field names you read need updating.

## [0.3.0] - 2026-09-13

### Changed

**Three types were corrected to what the API actually returns.** Each was wrong from the first release, and each breaks compilation rather than behaviour: the runtime payload is unchanged, so code that reads these responses keeps working once the field names are updated. Running the documented examples against the live API is what surfaced all three.

- `FavoriteFirearm` (`GET /v1/me/favorites`) was `{ firearmId, createdAt }`, neither of which that endpoint has ever sent. It is the firearm record in **snake_case** - `id`, `firearm_id`, `favorited_at`, `name`, `manufacturer_id`, `manufacturer_name`, `category_id`, `category_name`, `status`, `year_introduced`, `action_type`, `country_of_origin`, `svg_line_art_url`, `model_3d_url`, `favorite_count`, `images` - because the endpoint answers its own SQL under column names, like the search results and unlike `/v1/firearms`.
- `DataCoverage` (`dataQuality.getCoverage`) was a single `{ field, percentage }` row. It is `{ firearms, calibers, manufacturers }`, each a new `TableCoverage`: `total`, plus `fields` mapping a column name to `{ filled, percentage }`. The documented example iterated `data.fields` and threw.
- `CountryArsenal` (`countries.getArsenal`) was `{ country, totalFirearms, groups[] }`. It is `{ countryCode, arsenal }`, where `arsenal` maps an operator type (`military`, `law_enforcement`, `civilian`, `unknown`, ...) to a list of the new `CountryArsenalEntry`. The example read `data.country.name` and threw on its first line.

### Fixed

- **Webhook signing and verification on Node 18 actually ships.** The fix was written for 0.2.3 and landed five minutes after that release was tagged, so the published 0.2.3 never contained it. Node 18 exposes WebCrypto only behind `node:crypto` and has no `globalThis.crypto`; the SDK now reaches it either way, with the module specifier held in a variable so a browser bundler does not try to resolve it. Every other runtime is unchanged.
- `IMAGE_TYPES` gains the labels the API actually stores: `gallery`, `primary`, `thumbnail`, `render`, `profile`, `angle` and `detail`. `gallery` is the default an upload lands on, and its absence made a correct value fail a union check.
- Examples and TSDoc no longer name `semi-automatic-pistol`, a category slug that does not exist. They use `pistol` and `sniper-rifle`.

### Added

- `TableCoverage` and `CountryArsenalEntry` are exported from the package root.
- TSDoc with a runnable `@example` on every method of `favorites`, `reports`, `support`, `usage` and `webhooks`. These are the samples the docs reference now renders and the release pipeline executes against the live API, so a snippet that stops working fails a build rather than a customer's first paste.

## [0.2.3] - 2026-09-12

### Fixed
- Webhook signing and verification on Node 18, which has WebCrypto only behind `node:crypto` and no `globalThis.crypto`; the SDK now reaches it either way. Every other runtime is unchanged.
- `package.json` is exported (`require('@buun_group/gunspec-sdk/package.json')`), which the `exports` map had hidden from tooling that reads a dependency's version.

## [0.2.2] - 2026-09-12

### Added
- `sourceKinds` and `bestSourceKind` on `Provenance`, with the `SourceKind` vocabulary (`SOURCE_KINDS`, strongest first: `manufacturer`, `standards_body`, `government`, `reference`, `aggregator`, `press`, `retailer`, `community`, `other`). Each cited page is classed on the API's source hierarchy; weigh a figure by `bestSourceKind`, never by `sources.length`.

## [0.2.1] - 2026-09-12

### Added
- `provenance` on `Firearm` (detail), `Caliber` and `AttachmentDetail`, with the `Provenance` type: `sources`, `dataConfidence`, `verifiedAt`, `verifiedFields`, `specSource`, `updatedAt`, `version`.
- `source: FitSource | null` on `AttachmentFit` and `AttachmentFirearmFit`: the weakest evidence behind a fit (`curated`, `universal`, `inferred`, `inherited:parent`, `inherited:platform`).
- Every closed vocabulary the API serves, generated from the API source into `src/types/vocabulary.ts`: `FIREARM_STATUSES`, `FIREARM_ACTION_TYPES`, `ATTACHMENT_STATUSES`, `MEDIA_KINDS`, `IMAGE_TYPES`, `SCHEMATIC_TYPES`, `TICKET_STATUSES`, `TICKET_PRIORITIES`, `TICKET_CATEGORIES`, `REPORT_ISSUE_TYPES`, `REPORT_STATUSES`, `INTERFACE_SOURCES`, `FIT_TYPES`, `FIT_SOURCES`, `GAME_ARCHETYPES`, `CHANGELOG_CATEGORIES`, `NOTICE_VARIANTS`, `OFFER_STATUSES`, `OFFER_TARGET_KINDS`, `ADOPTION_TYPES`, each with a union type of the same name (`FirearmStatus`, `FitSource` ...). The models use these unions; the tool manifest's enums read from them.
- `components` and `Schema<Name>`: the raw OpenAPI schema types, generated from `apps/api/openapi.json` by `pnpm generate:types`. Every hand-written model is checked against its schema at type level on each test run, and the suite fails when the spec is newer than the generated file.
- Caliber geometry: `shoulderDiameterMm`, `rimDiameterMm`, `rimThicknessMm`, `bulletLengthMm`, `caseShape`, `caseMaterial`, `projectileKind`, `bulletProfile`, `closure`, `markingColor`, `markingMeaning`, `specSource`, `specStandard`, `dataConfidence`, `verifiedAt`, `verifiedFields`, `version`, on `Caliber` and (the drawing fields) on `FirearmCaliberEntry`.
- `version` on `Firearm`, `FirearmListItem` and `Manufacturer`; `updatedAt` and `images` on `FirearmListItem`; `schematics` on `FirearmDetail` (Studio and above); `kind`, `storage`, `author`, `sourceUrl`, `alt`, `width`, `height`, `sortOrder` on `FirearmImage`; `bulletSvgUrl` on `Ammunition`; `InlineMediaItem`; `WebhookEndpointCreated` (the one response that carries `secret`).

### Fixed
Type corrections where a hand-written model disagreed with the API, found by the new mirror test. None changes what the API sends.
- `Firearm.status`, `FirearmListItem.status`, `FirearmVariant.status` allow every value the catalog holds (`out_of_production`, `in_service`, `limited_production` were missing).
- `FirearmImage.type` is the `ImageType` vocabulary (`svg`, `photo`, `3d_model`), marked deprecated in favour of `kind`.
- `Firearm.has3dModel` is never null.
- `FitVia.source` is `InterfaceSource`, not `string`; `AttachmentFirearmFit.images` and `InterfaceFirearm.images` are `InlineMediaItem[]`, not `FirearmImage[]`.
- `WebhookEndpoint` no longer claims `secret` on every read; only `WebhookEndpointCreated` carries it. `WebhookTestResult` is `{ delivered, httpStatus, error }`.
- `SupportTicket` and `SupportTicketReply` use the API's snake_case fields (`created_at`, `updated_at`, `closed_at`, `reply_count`, `ticket_id`); `SupportTicket.category` is a nullable string; `description` is optional on list rows.
- `DataReport` carries `reviewedAt` rather than `updatedAt`; `suggestedValue` is nullable; `issueType` and `status` are the `ReportIssueType` and `ReportStatus` vocabularies.
- `ChangelogEntry.id` is a string; `body`, `publishedAt` are optional; `published`, `createdAt`, `updatedAt` added.
- `FirearmSchematic` is `{ id, firearmId, title, type, url, format, version, manufacturer, source, sourceUrl, author, license, createdAt }`, as served.
- `SiteNotice.variant` is `NoticeVariant`; `VendorOffer.targetKind` and `status` are `OfferTargetKind` and `OfferStatus`.

## [0.2.0] - 2026-09-11

### Added
- Resources: `attachments`, `interfaces`, `platforms`, `vendor`; `firearms.resolve`, `resolveMany`, `mediaCatalog`, `listMedia`, `getMedia`, `downloadMedia`, `getImageAsset`, `getModel`, `getOffers`, `getInterfaces`, `getAttachments`; `content.listNotices`.
- Errors carry `reason`, `details`, `retryAfter` and `action`; new `ConflictError` (409), `PayloadTooLargeError` (413), `ServiceUnavailableError` (503), `ConfigurationError`; `PermissionError.requiredTier`, `RateLimitError.isDailyCap`.
- `ERROR_REASONS` and `WEBHOOK_EVENT_TYPES`, generated from the API source by `scripts/sync-api-contracts.mjs`.
- `etagCache` option: conditional requests with `If-None-Match`, a 304 served from the held body with `fromCache: true`; `ETagStore` and `MemoryETagStore`; `etag` and `cacheControl` on every response; `HttpClient.requestConditional`.
- `authScheme: 'bearer'`; `apiKey: null` for explicit anonymous use; `allowInsecure`; `fetch` injection.
- `HttpClient.requestRaw`, `getText`, `getBytes`, `resolveRedirect`, `urlFor`, `patch`, `isAuthenticated`.
- Webhook verification: `verifyWebhookSignature`, `constructWebhookEvent`, `signWebhookPayload`, `parseSignatureHeader`, `WEBHOOK_HEADERS`.
- `GunSpec.withOptions` for a derived client; `GunSpec.http` for endpoints the resources do not cover.
- Tool manifest at `@buun_group/gunspec-sdk/tools` for agent hosts.
- Integration suite against a live API (`pnpm test:integration`).

### Changed
- Retries honour `Retry-After` on 429 and 503, never retry a spent daily cap, and refuse to sleep past `retry.maxRetryAfterMs` (default 30 s).
- A key is refused over plain `http://` to any host but localhost; the key is masked in `JSON.stringify(client)`.
- `PaginatedResponse` gained `per_page` and optional `meta`.

### Fixed
- `ammunition.getBulletSvg` parsed an SVG as JSON and returned nothing.
- `favorites.listIds` was typed as `string[]`; the API returns `{ ids: string[] }`.

## [0.1.1] - 2026-08-22

### Added
- `content`, `collections`, `firearms.getSchematics`, `firearms.popular`, `stats.catalogCoverage`.

## [0.1.0]

Initial release.

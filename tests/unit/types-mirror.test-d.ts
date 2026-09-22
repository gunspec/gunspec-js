/**
 * Every hand-written model mirrors the spec schema for the same response.
 *
 * `src/types/generated/openapi.d.ts` is what the API promises; the hand models
 * are what a caller reads. This file holds them to each other, in both
 * directions, so a field the API gains and the SDK does not is a type error.
 * `Mirror<Hand, Spec>` resolves to `never` when the two agree and otherwise to
 * a union of tagged keys, which `assertNever<...>()` refuses to compile with
 * the keys in the message:
 *
 *   `missing_in_sdk:<key>`  the spec has it, the model does not
 *   `not_in_spec:<key>`     the model has it, the spec does not
 *   `disagrees:<key>`       both have it and the value types differ
 *
 * Optionality is ignored on purpose: the spec marks few properties `required`,
 * and `?` on a hand model means "absent on some plans", which the spec cannot
 * express. `unknown` on the spec side matches anything, because an untyped
 * `array` or `object` in the spec is a gap in the spec, not a disagreement.
 *
 * Runs under `vitest --typecheck` (part of `pnpm test`) and `pnpm typecheck`.
 * The `it` blocks execute as no-ops so the file also shows up in the report.
 *
 * Where the spec under-describes what the API sends, the exception is named
 * in the `Skip` parameter and explained beside it: the fix belongs in
 * `apps/api/src/openapi/`, not in the model.
 */
import { describe, it } from 'vitest';
import type { components, operations } from '../../src/types/generated';
import type {
  Ammunition,
  Attachment,
  AttachmentDetail,
  AttachmentFirearmFit,
  AttachmentFit,
  BlogPost,
  Caliber,
  Category,
  ChangelogEntry,
  DataReport,
  FavoriteToggle,
  Firearm,
  FirearmAttachments,
  FirearmCaliberEntry,
  FirearmDetail,
  FirearmImage,
  FirearmInterface,
  FirearmInterfaces,
  FirearmListItem,
  FirearmMedia,
  FirearmSchematic,
  FirearmUser,
  FirearmVariant,
  FitVia,
  InlineMediaItem,
  InterfaceFirearm,
  InterfaceStandard,
  Manufacturer,
  MediaCatalogItem,
  Platform,
  PlatformDetail,
  Provenance,
  PublicOffer,
  PushOffersResult,
  ResolveManyResult,
  ResolveResult,
  SiteNotice,
  SupportTicket,
  SupportTicketReply,
  UsageStats,
  VendorOffer,
  VendorShop,
  WebhookEndpoint,
  WebhookEndpointCreated,
  WebhookTestResult,
} from '../../src/types';

type S = components['schemas'];

/** The `data` member of an operation's success body. */
type Data<Op extends keyof operations, Status extends 200 | 201 = 200> =
  operations[Op]['responses'] extends Record<Status, { content: { 'application/json': { data: infer D } } }> ? D : never;

type IsUnknown<T> = unknown extends T ? true : false;

/** Strip `?` and `undefined` recursively; `unknown` becomes a wildcard. */
type Strict<T> = IsUnknown<T> extends true
  ? any // eslint-disable-line @typescript-eslint/no-explicit-any
  : T extends readonly (infer U)[]
    ? Strict<U>[]
    : T extends object
      ? { [K in keyof T]-?: Strict<Exclude<T[K], undefined>> }
      : T;

type Mirrors<H, Sp> = [Strict<H>] extends [Strict<Sp>] ? ([Strict<Sp>] extends [Strict<H>] ? true : false) : false;

type Tag<Prefix extends string, K> = K extends string ? `${Prefix}:${K}` : never;

type MissingInSdk<H, Sp> = Tag<'missing_in_sdk', Exclude<keyof Sp, keyof H>>;
type NotInSpec<H, Sp> = Tag<'not_in_spec', Exclude<keyof H, keyof Sp>>;
type Disagree<H, Sp, Skip extends PropertyKey> = {
  [K in Exclude<keyof H & keyof Sp, Skip>]-?: Mirrors<Exclude<H[K], undefined>, Exclude<Sp[K], undefined>> extends true
    ? never
    : Tag<'disagrees', K>;
}[Exclude<keyof H & keyof Sp, Skip>];

/** `never` when the hand model and the spec schema agree; tagged keys otherwise. */
type Mirror<H, Sp, Skip extends PropertyKey = never> = MissingInSdk<H, Sp> | NotInSpec<H, Sp> | Disagree<H, Sp, Skip>;

/** Compiles only when `T` is `never`; the error names the offending keys. */
function assertNever<T extends never>(): T | undefined {
  return undefined;
}

describe('hand-written models mirror the OpenAPI schemas', () => {
  it('firearms', () => {
    assertNever<Mirror<Firearm, S['FirearmRecord']>>();
    assertNever<Mirror<FirearmListItem, S['FirearmListItem']>>();
    // `firearm.service/detail.ts` sends `manufacturer: null` (and `category`)
    // when the id resolves to nothing; the spec marks neither nullable.
    assertNever<Mirror<FirearmDetail, S['FirearmDetail'], 'manufacturer' | 'category'>>();
    assertNever<Mirror<FirearmCaliberEntry, S['FirearmCaliber']>>();
    assertNever<Mirror<FirearmVariant, S['FirearmVariant']>>();
    assertNever<Mirror<FirearmImage, S['FirearmImage']>>();
    assertNever<Mirror<FirearmUser, S['FirearmUser']>>();
    assertNever<Mirror<FirearmSchematic, S['FirearmSchematic']>>();
    assertNever<Mirror<Provenance, S['Provenance']>>();
  });

  it('catalog', () => {
    assertNever<Mirror<Manufacturer, S['Manufacturer']>>();
    assertNever<Mirror<Caliber, S['Caliber']>>();
    assertNever<Mirror<Category, S['Category']>>();
    assertNever<Mirror<Ammunition, S['AmmunitionLoad']>>();
  });

  it('compatibility', () => {
    assertNever<Mirror<InterfaceStandard, S['InterfaceStandard']>>();
    assertNever<Mirror<FirearmInterface, S['ResolvedInterface']>>();
    assertNever<Mirror<FitVia, S['FitVia']>>();
    assertNever<Mirror<Attachment, S['Attachment']>>();
    assertNever<Mirror<AttachmentDetail, S['AttachmentDetail']>>();
    assertNever<Mirror<AttachmentFit, S['AttachmentFit']>>();
    assertNever<Mirror<FirearmInterfaces, Data<'getFirearmInterfaces'>>>();
    assertNever<Mirror<FirearmAttachments, Data<'getFirearmAttachments'>>>();
    assertNever<Mirror<AttachmentFirearmFit, Data<'getAttachmentFirearms'>[number]>>();
    assertNever<Mirror<InterfaceFirearm, Data<'getInterfaceStandardFirearms'>[number]>>();
    assertNever<Mirror<Platform, Data<'listPlatforms'>[number]>>();
    assertNever<Mirror<PlatformDetail, Data<'getPlatform'>>>();
  });

  it('sellers', () => {
    assertNever<Mirror<PublicOffer, Data<'getAttachmentOffers'>[number]>>();
    assertNever<Mirror<PublicOffer, Data<'getFirearmOffers'>[number]>>();
    assertNever<Mirror<VendorShop, Data<'listVendorShops'>[number]>>();
    assertNever<Mirror<VendorOffer, Data<'listVendorOffers'>[number]>>();
    assertNever<Mirror<PushOffersResult, Data<'pushVendorOffers'>>>();
  });

  it('media, resolution, notices', () => {
    assertNever<Mirror<FirearmMedia, S['MediaItem']>>();
    assertNever<Mirror<InlineMediaItem, S['InlineMediaItem']>>();
    assertNever<Mirror<MediaCatalogItem, S['MediaCatalogEntry']>>();
    assertNever<Mirror<ResolveResult, Data<'resolveFirearm'>>>();
    assertNever<Mirror<ResolveManyResult, Data<'resolveFirearms'>>>();
    assertNever<Mirror<SiteNotice, S['SiteNotice']>>();
  });

  it('account and content', () => {
    assertNever<Mirror<WebhookEndpoint, S['WebhookEndpoint']>>();
    assertNever<Mirror<WebhookEndpointCreated, S['WebhookEndpointCreated']>>();
    assertNever<Mirror<WebhookTestResult, Data<'testMyWebhook'>>>();
    assertNever<Mirror<DataReport, S['DataReport']>>();
    assertNever<Mirror<SupportTicket, S['SupportTicket']>>();
    assertNever<Mirror<SupportTicketReply, Data<'replyToMyTicket', 201>>>();
    assertNever<Mirror<FavoriteToggle, Data<'removeMyFavorite'>>>();
    assertNever<Mirror<UsageStats, Data<'getMyUsage'>>>();
    assertNever<Mirror<ChangelogEntry, S['ChangelogEntry']>>();
    assertNever<Mirror<BlogPost, S['BlogPost']>>();
  });
});

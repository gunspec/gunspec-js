import { HttpClient } from './core/http-client'
import type { RetryConfig } from './core/retry'
import type { AuthScheme } from './core/auth'
import type { ETagStore } from './core/etag-cache'
import { FirearmsResource } from './resources/firearms'
import { ManufacturersResource } from './resources/manufacturers'
import { CalibersResource } from './resources/calibers'
import { CategoriesResource } from './resources/categories'
import { StatsResource } from './resources/stats'
import { GameResource } from './resources/game'
import { GameStatsResource } from './resources/game-stats'
import { AmmunitionResource } from './resources/ammunition'
import { CountriesResource } from './resources/countries'
import { ConflictsResource } from './resources/conflicts'
import { ContentResource } from './resources/content'
import { DocsResource } from './resources/docs'
import { CollectionsResource } from './resources/collections'
import { DataQualityResource } from './resources/data-quality'
import { FavoritesResource } from './resources/favorites'
import { ReportsResource } from './resources/reports'
import { SupportResource } from './resources/support'
import { WebhooksResource } from './resources/webhooks'
import { UsageResource } from './resources/usage'
import { AttachmentsResource } from './resources/attachments'
import { InterfacesResource } from './resources/interfaces'
import { PlatformsResource } from './resources/platforms'
import { VendorResource } from './resources/vendor'
import { VERSION } from './version'

/**
 * Configuration options for the GunSpec client.
 *
 * @example
 * ```typescript
 * // Reads GUNSPEC_API_KEY from process.env automatically
 * const client = new GunSpec();
 *
 * // A mirror that polls: hold ETags so unchanged answers cost nothing
 * const client = new GunSpec({ etagCache: true });
 * ```
 */
export interface ClientOptions {
  /**
   * API key for authentication. If not provided, reads from the
   * `GUNSPEC_API_KEY` environment variable. Never hardcode one. Pass `null`
   * to be anonymous on purpose (public endpoints only, environment ignored).
   */
  apiKey?: string | null

  /**
   * Header to carry the key in: `X-API-Key` (default) or
   * `Authorization: Bearer`. Both are permanent on the API.
   */
  authScheme?: AuthScheme

  /**
   * Base URL for the API. Defaults to `https://api.gunspec.io`. A key is
   * refused over plain `http://` to anything but localhost unless
   * {@link allowInsecure} is set.
   */
  baseURL?: string

  /** Permit a key over plain `http://` to a remote host. Off by default. */
  allowInsecure?: boolean

  /** Request timeout in milliseconds. Defaults to 30000 (30s). */
  timeout?: number

  /** Retry configuration for failed requests. */
  retry?: RetryConfig

  /**
   * Send `If-None-Match` on every GET and serve the held body when the API
   * answers `304`. A 304 does not count against the plan's daily cap, so a
   * poller that mostly sees unchanged data costs almost nothing. `true` uses
   * an in-memory LRU; pass an {@link ETagStore} to persist across processes.
   */
  etagCache?: boolean | ETagStore

  /** Custom default headers to include with every request. */
  defaultHeaders?: Record<string, string>

  /** A `fetch` implementation to use instead of the global one. */
  fetch?: typeof fetch
}

/**
 * GunSpec.io API client - the main entry point for the SDK.
 *
 * Provides typed access to the firearms specification database API
 * through resource-oriented properties that mirror the API structure.
 *
 * @example
 * ```typescript
 * import { GunSpec } from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * const { data, pagination } = await client.firearms.list({ category: 'pistol' });
 * const { data: glock } = await client.firearms.get('glock-g17');
 *
 * // What fits it? (Studio)
 * const { data: fits } = await client.firearms.getAttachments('glock-g17');
 *
 * // Where to buy a part
 * const { data: offers } = await client.attachments.getOffers('surefire-socom556-rc2');
 * const href = client.vendor.clickUrl(offers[0].clickId);
 * ```
 */
export class GunSpec {
  /** Firearms specifications, search, comparison, media and related data */
  readonly firearms: FirearmsResource

  /** Firearm manufacturers and their products */
  readonly manufacturers: ManufacturersResource

  /** Ammunition calibers and cartridge specifications */
  readonly calibers: CalibersResource

  /** Firearm categories (pistol, rifle, shotgun, etc.) */
  readonly categories: CategoriesResource

  /** Aggregate statistics across the database */
  readonly stats: StatsResource

  /** Game development tools - balance reports, tier lists, matchups */
  readonly game: GameResource

  /** Versioned game stats snapshots for pinning game builds */
  readonly gameStats: GameStatsResource

  /** Ammunition loads, ballistics, and bullet data */
  readonly ammunition: AmmunitionResource

  /** Countries and their military/law enforcement arsenals */
  readonly countries: CountriesResource

  /** Armed conflicts and the firearms used in them */
  readonly conflicts: ConflictsResource

  /** Public changelog entries, blog posts and site notices. No API key required. */
  readonly content: ContentResource

  /** The API reference and plan limits as data: operations, printed samples, limits. Any plan, Explorer included. */
  readonly docs: DocsResource

  /** Publicly shared user collections. No API key required. */
  readonly collections: CollectionsResource

  /** Attachment catalog and what fits what (fit computation is Studio) */
  readonly attachments: AttachmentsResource

  /** Mount interface standards the fit engine reasons over */
  readonly interfaces: InterfacesResource

  /** Firearm platforms (families) whose interfaces members inherit (Studio) */
  readonly platforms: PlatformsResource

  /** Seller listings: read, push, update and withdraw your own offers (Enterprise) */
  readonly vendor: VendorResource

  /** Data quality metrics (Enterprise tier) */
  readonly dataQuality: DataQualityResource

  /** User's favorited firearms */
  readonly favorites: FavoritesResource

  /** Data quality reports */
  readonly reports: ReportsResource

  /** Support tickets (paid tiers) */
  readonly support: SupportResource

  /** Webhook endpoint management and delivery verification (studio+ tier) */
  readonly webhooks: WebhooksResource

  /** API usage statistics */
  readonly usage: UsageResource

  /** The underlying HTTP client (for advanced use) */
  private readonly _client: HttpClient

  /**
   * What this client was built with, so {@link withOptions} can derive
   * another. Everything but the key, which is held in {@link #apiKey}.
   */
  private readonly _options: Omit<ClientOptions, 'apiKey'>

  /* An ES private field, not a plain property, so `console.log(client)` and
     `util.inspect` cannot print the key. It is kept only so `withOptions`
     can carry it over. */
  readonly #apiKey: string | null | undefined

  constructor(options: ClientOptions = {}) {
    const { apiKey, ...rest } = options
    this._options = rest
    this.#apiKey = apiKey
    this._client = new HttpClient({
      baseUrl: options.baseURL ?? 'https://api.gunspec.io',
      timeout: options.timeout ?? 30_000,
      auth: {
        apiKey: options.apiKey,
        scheme: options.authScheme,
      },
      retry: options.retry,
      etagCache: options.etagCache,
      allowInsecure: options.allowInsecure,
      fetch: options.fetch,
      headers: {
        ...options.defaultHeaders,
        'User-Agent': `gunspec-sdk/typescript/${VERSION}`,
        'X-SDK-Version': VERSION,
        'X-SDK-Language': 'typescript',
      },
    })

    this.firearms = new FirearmsResource(this._client)
    this.manufacturers = new ManufacturersResource(this._client)
    this.calibers = new CalibersResource(this._client)
    this.categories = new CategoriesResource(this._client)
    this.stats = new StatsResource(this._client)
    this.game = new GameResource(this._client)
    this.gameStats = new GameStatsResource(this._client)
    this.ammunition = new AmmunitionResource(this._client)
    this.countries = new CountriesResource(this._client)
    this.conflicts = new ConflictsResource(this._client)
    this.content = new ContentResource(this._client)
    this.docs = new DocsResource(this._client)
    this.collections = new CollectionsResource(this._client)
    this.attachments = new AttachmentsResource(this._client)
    this.interfaces = new InterfacesResource(this._client)
    this.platforms = new PlatformsResource(this._client)
    this.vendor = new VendorResource(this._client)
    this.dataQuality = new DataQualityResource(this._client)
    this.favorites = new FavoritesResource(this._client)
    this.reports = new ReportsResource(this._client)
    this.support = new SupportResource(this._client)
    this.webhooks = new WebhooksResource(this._client)
    this.usage = new UsageResource(this._client)
  }

  /** Whether a credential will be sent. The key itself is never exposed. */
  get isAuthenticated(): boolean {
    return this._client.isAuthenticated
  }

  /** The low-level transport, for endpoints the resource classes do not cover yet. */
  get http(): HttpClient {
    return this._client
  }

  /**
   * A new client with some options changed and the rest carried over. The
   * way to scope a different key, timeout or retry policy to one piece of
   * work without mutating the client everything else shares.
   *
   * @example
   * ```typescript
   * const patient = client.withOptions({ timeout: 120_000, retry: { maxRetries: 5 } })
   * const asShop = client.withOptions({ apiKey: shopKey })
   * ```
   */
  withOptions(overrides: Partial<ClientOptions>): GunSpec {
    return new GunSpec({ ...this._options, apiKey: this.#apiKey, ...overrides })
  }

  /** What `JSON.stringify` and loggers see: the transport's masked view, never the key. */
  toJSON(): Record<string, unknown> {
    return { version: VERSION, ...this._client.toJSON() }
  }

  /** What `console.log` and `util.inspect` print in Node, Bun and Deno: the same masked view. */
  [Symbol.for('nodejs.util.inspect.custom')](): Record<string, unknown> {
    return this.toJSON()
  }
}

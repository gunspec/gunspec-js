// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: account
// ---------------------------------------------------------------------------
import type { Firearm } from './firearm';
import type { FirearmStatus, ReportIssueType, ReportStatus, SchematicType, TicketPriority, TicketStatus } from '../vocabulary';
import type { InlineMediaItem } from '../media';

// ── User-Scoped Resources (via /v1/me) ────────────────────────────────────

/**
 * A user's favorited firearm, with enough of the record to render a card.
 *
 * Returned by `GET /v1/me/favorites`. **snake_case**, like the search results
 * and unlike `/v1/firearms`: the endpoint answers its own SQL under column
 * names. This was typed as `{ firearmId, createdAt }`, neither of which the
 * endpoint has ever sent.
 */
export interface Favorite {
  /** Firearm slug. The same value as `firearm_id`. */
  id: string;
  /** Firearm slug, under the favorites table's own column name. */
  firearm_id: string;
  /** When this account favorited it, as the database stamps it (`YYYY-MM-DD HH:MM:SS`, UTC). Newest first. */
  favorited_at: string;
  /** Display name. */
  name: string;
  /** Manufacturer slug. */
  manufacturer_id: string | null;
  /** Display name of the manufacturer, joined in so a card needs no second call. */
  manufacturer_name: string | null;
  /** Category slug. */
  category_id: string | null;
  /** Display name of the category. */
  category_name: string | null;
  /** Production status. */
  status: FirearmStatus | null;
  /** Year the model was introduced. */
  year_introduced: number | null;
  /** Operating action as stored, underscored. */
  action_type: string | null;
  /** ISO 3166-1 alpha-2 country of origin. */
  country_of_origin: string | null;
  /** Line-art silhouette, or null where none has been drawn. */
  svg_line_art_url: string | null;
  /** GLB model, or null where none is on file. */
  model_3d_url: string | null;
  /** How many accounts have favorited this record. */
  favorite_count: number;
  /** Every image this firearm has, silhouette first. Empty when none are on file. */
  images: InlineMediaItem[];
}

/**
 * Result of toggling a favorite.
 *
 * Returned by `POST /v1/me/favorites/:firearmId` and `DELETE /v1/me/favorites/:firearmId`.
 */
export interface FavoriteToggle {
  /** Firearm slug. */
  firearmId: string;
  /** Whether the firearm is now favorited. */
  favorited: boolean;
}

/**
 * A user-submitted data quality report.
 *
 * Returned by `GET /v1/me/reports` and `POST /v1/me/reports`.
 */
export interface DataReport {
  /** Unique report ID. */
  readonly id: string;
  /** Firearm slug the report pertains to. */
  firearmId: string;
  /** Section of the firearm page (e.g. `"specs"`, `"game-stats"`). */
  section: string;
  /** Type of issue reported. */
  issueType: ReportIssueType;
  /** User-provided description of the issue. */
  description: string;
  /** Reference URLs supporting the report. */
  references?: string[];
  /** Suggested correction, or null. */
  suggestedValue?: string | null;
  /** Current review status. */
  status: ReportStatus;
  /** ISO-8601 creation timestamp. */
  readonly createdAt?: string;
  /** ISO-8601 timestamp of the staff review, or null while pending. */
  readonly reviewedAt?: string | null;
}

/**
 * A support ticket summary.
 *
 * Returned by `GET /v1/me/support`. This resource keeps the API's snake_case
 * field names (`created_at`, not `createdAt`).
 */
export interface SupportTicket {
  /** Unique ticket ID. */
  readonly id: string;
  /** Ticket subject line. */
  subject: string;
  /** Ticket description / body. */
  description?: string;
  /** Ticket category (`billing`, `technical`, `data_quality`, `feature_request`, `other`). */
  category?: string | null;
  /** Priority level. */
  priority: TicketPriority;
  /** Current status. `waiting` means we are waiting on the customer. */
  status: TicketStatus;
  /** Customer-visible replies on the thread. */
  reply_count?: number;
  /** ISO-8601 creation timestamp. */
  readonly created_at?: string;
  /** ISO-8601 last-update timestamp. */
  readonly updated_at?: string;
  /** ISO-8601 close timestamp, or null while open. */
  readonly closed_at?: string | null;
}

/**
 * A support ticket with its reply thread.
 *
 * Returned by `GET /v1/me/support/:ticketId`.
 */
export interface SupportTicketDetail extends SupportTicket {
  /** Reply thread ordered chronologically. */
  replies: SupportTicketReply[];
}

/**
 * A single reply in a support ticket thread. Snake_case, like the ticket.
 */
export interface SupportTicketReply {
  /** Auto-increment reply ID. */
  readonly id: number;
  /** Parent ticket ID. */
  ticket_id: string;
  /** Reply message body. */
  message: string;
  /** ISO-8601 creation timestamp. */
  readonly created_at?: string;
}

/**
 * A webhook endpoint configuration.
 *
 * Returned by `GET /v1/me/webhooks` and related endpoints.
 */
export interface WebhookEndpoint {
  /** Unique endpoint ID. */
  readonly id: string;
  /** Delivery URL. */
  url: string;
  /** Optional human-readable description. */
  description?: string | null;
  /** Event types this endpoint subscribes to. */
  events: string[];
  /** Whether the endpoint is active. */
  active: boolean;
  /** ISO-8601 creation timestamp. */
  readonly createdAt?: string;
  /** ISO-8601 last-update timestamp. */
  readonly updatedAt?: string;
}

/**
 * The endpoint as `POST /v1/me/webhooks` returns it: the only response that
 * carries the signing secret. Store it; it is not shown again.
 */
export interface WebhookEndpointCreated extends WebhookEndpoint {
  /** HMAC signing secret for verifying payloads. */
  secret: string;
}

/**
 * Result of sending a test event to a webhook endpoint.
 *
 * Returned by `POST /v1/me/webhooks/:id/test`.
 */
export interface WebhookTestResult {
  /** Whether the endpoint acknowledged the test delivery. */
  delivered: boolean;
  /** HTTP status the endpoint answered with, or null when it could not be reached. */
  httpStatus: number | null;
  /** Why delivery failed, or null. */
  error: string | null;
}

/**
 * API usage statistics for the authenticated user.
 *
 * Returned by `GET /v1/me/usage`.
 */
export interface UsageStats {
  /**
   * This UTC month's usage against the plan's allowance, which is enforced for
   * the whole account: every key draws on one pool, and once `used` reaches
   * `limit` every call is refused with `MONTHLY_CAP_EXCEEDED` until `resetsAt`.
   * The same figures ride every keyed response as `X-Monthly-Limit`,
   * `X-Monthly-Remaining` and `X-Monthly-Reset` (see `response.rateLimit`).
   */
  currentMonth: {
    /**
     * Requests served this month across every key. Calls a limit refused with
     * a 429, and 304s, are not counted: they spent nothing, and this is the
     * figure the allowance is enforced against.
     */
    used: number;
    /** Monthly request limit for the plan. */
    limit: number;
    /** Requests left this month, never below zero. */
    remaining?: number;
    /** Usage as a percentage of the allowance. */
    percentage: number;
    /** ISO-8601 timestamp when usage resets: midnight UTC on the 1st, for every plan. */
    resetsAt: string;
  };
  /**
   * What is left of today, against the limit that is enforced: the daily limit,
   * counted per key. The same figures ride every `/v1` response as
   * `X-Daily-Limit`, `X-Daily-Remaining` and `X-Daily-Reset` (see
   * `response.rateLimit`), so pacing needs no call to this endpoint; this is the
   * figure to reconcile against, and the one that shows every key at once.
   * Absent from an API that predates it.
   */
  daily?: {
    /**
     * Requests one key may make per UTC day on this plan: the limit that is
     * enforced, held against each key on its own. `null` on a plan with no
     * daily ceiling.
     */
    limitPerKey: number | null;
    /** Requests made today (UTC) across every key. Not comparable with `limitPerKey` unless the account has one key. */
    usedToday: number;
    /**
     * The key nearest its daily limit, or null when no key has made a request
     * today. `used` counts calls the limit refused too, so it can pass
     * `limitPerKey`: far past it means that key kept calling after being told to stop.
     */
    busiestKeyToday: {
      keyId: string;
      keyName: string;
      used: number;
      /** Requests that key has left today, never below zero; `null` with no daily ceiling. */
      remaining: number | null;
      /** Share of `limitPerKey` used, rounded. Can exceed 100. */
      percentage: number;
    } | null;
    /** ISO-8601 instant the daily counters return to zero: the next midnight UTC. Same as `X-Daily-Reset`. */
    resetsAt: string;
  };
  /**
   * Usage through the hosted MCP server. A subset of `currentMonth.used`, never
   * added to it. Its daily limit applies to each key separately. Absent from an
   * API that predates it.
   */
  mcp?: {
    /** MCP calls in the reported month. */
    usedThisMonth: number;
    /** MCP calls today (UTC) across every key. */
    usedToday: number;
    /** MCP calls one key may make per UTC day on this plan. */
    dailyLimitPerKey: number;
    /** The key nearest its daily MCP limit, or null when no key has made an MCP call today. */
    busiestKeyToday: { keyId: string; keyName: string; used: number; percentage: number } | null;
    /** ISO-8601 timestamp of the next midnight UTC, when the daily counters reset. */
    resetsAt: string;
  };
  /**
   * Your standing. Experience is earned per call made by an SDK, the MCP
   * server, a script or a request tool, weighted by what the call is; a
   * browser, a `304` and a failed call earn nothing. Absent from an API that
   * predates it.
   */
  progress?: {
    /** Experience earned across every key on the account, for its whole life. */
    xp: number;
    /** Experience earned today (UTC). */
    xpToday: number;
    /** The most one key can earn in a UTC day. */
    dailyXpCap: number;
    /** Level, derived from `xp` alone. */
    level: number;
    /** The experience this level began at. */
    levelStartsAt: number;
    /** The experience the next level begins at. */
    nextLevelAt: number;
    /** Consecutive days with a call, counting today; yesterday still counts as unbroken. */
    streakDays: number;
    /** Days with any call, over the last two years. */
    daysActive: number;
    /** Documented operations called at least once, counted nightly. */
    operationsUsed: number;
    /** Documented operations there are to call, counted from the spec. */
    operationsAvailable: number;
  };
  /**
   * Calls to endpoints above your plan, attached to the account so every key
   * draws on the same balance. Every new account starts with a one-time grant
   * covering any endpoint up to Studio. A call spent this way is served as that
   * plan is served, carries `X-Endpoint-Credit: spent`, and is given back if it
   * fails. Absent from an API that predates it.
   */
  endpointCredits?: {
    /** Calls left across every credit that can still be spent. */
    remaining: number;
    /** Every credit the account has had, newest first, spent ones included. */
    credits: Array<{
      /** Id of the credit. */
      id: string;
      /** `welcome` for the one-time grant every account receives, `staff` for a credit the team gave you. */
      source: string;
      /** The operations it covers, or null when it covers everything up to `maxTier`. */
      operations: string[] | null;
      /** The highest plan whose endpoints it covers, or null when it names operations. */
      maxTier: string | null;
      /** Calls the credit was given. */
      callsGranted: number;
      /** Calls spent so far. */
      callsUsed: number;
      /** Calls left on it; zero once spent, expired or withdrawn. */
      callsRemaining: number;
      /** When it lapses, ISO 8601 UTC, or null when it does not. */
      expiresAt: string | null;
      /** `active`, `spent`, `expired` or `revoked`. */
      status: string;
      /** When it was given. */
      createdAt: string;
    }>;
  };
  /** Daily request counts for the requested period; `mcpCount` is the MCP share. */
  dailyBreakdown: Array<{ date: string; count: number; mcpCount?: number }>;
  /** Per-API-key usage breakdown; `mcpToday` is what the key's daily MCP limit is held against. */
  perKey: Array<{
    keyId: string;
    keyName: string;
    count: number;
    mcpCount?: number;
    mcpToday?: number;
    /** Requests this key made today (UTC), the figure its daily limit is held against. Counts refused calls. */
    today?: number;
    /** Requests this key has left today, never below zero; `null` with no daily ceiling. */
    remainingToday?: number | null;
  }>;
  /** Total number of API keys. */
  keyCount: number;
  /** Current subscription tier details. */
  tier: {
    /** Tier display name. */
    name: string;
    /** Monthly request allowance. */
    requestsPerMonth: number;
    /** Requests per minute limit. */
    rateLimit: number;
    /** Requests each key may make per UTC day: the limit that is enforced. `null` with no daily ceiling. */
    requestsPerDay?: number | null;
    /** MCP calls each key may make per UTC day. */
    mcpCallsPerDay?: number;
  };
}

/** A published changelog entry. */
export interface ChangelogEntry {
  /** Entry id. */
  id: string;
  /** Headline. */
  title: string;
  /** Body copy, plain text or markdown. */
  body?: string;
  /** Entry category (`feature`, `improvement`, `bugfix`, `data`, `breaking`). */
  category?: string | null;
  /** ISO-8601 publication timestamp. */
  publishedAt?: string;
  /** `1` once published. */
  published?: number;
  /** ISO-8601 creation timestamp. */
  createdAt?: string;
  /** ISO-8601 last-update timestamp. */
  updatedAt?: string;
}

/**
 * A published blog post, as `GET /v1/blog` and `GET /v1/blog/{slug}` send it.
 *
 * This was typed `{ id: number, excerpt, heroImageUrl, publishedAt }`, none of
 * which the API has ever sent: the endpoint selects a fixed column list off
 * `blog_posts`, where the id is text and the three fields are named `summary`,
 * `heroImage` and `postedAt`. Reading any of them returned `undefined`.
 */
export interface BlogPost {
  /** Post id. */
  id: string;
  /** URL slug. */
  slug: string;
  /** Post title. */
  title: string;
  /** Short summary shown in listings. */
  summary: string | null;
  /** Full body. Present on the detail endpoint only. */
  body?: string | null;
  /** Hero image URL. */
  heroImage: string | null;
  /** Alt text for the hero image. */
  heroAlt?: string | null;
  /** Category slug, or null when the post is uncategorised. */
  category: string | null;
  /** Publication state. A public read only ever returns published posts. */
  status: string;
  /** ISO-8601 publication timestamp, null until the post is published. */
  postedAt: string | null;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-update timestamp. */
  updatedAt: string;
  /** Who wrote it, or null for a post nobody is credited on. */
  author?: BlogPostAuthor | null;
}

/** The author of a blog post, as the public blog shows them. */
export interface BlogPostAuthor {
  /** The author's display name, as set on their GunSpec account. */
  name: string;
  /** URL segment of the author's page on the blog, made from their display name. */
  handle: string;
  /** DiceBear style of the author's generated avatar. */
  avatarStyle: string;
  /** Seed of the author's generated avatar. */
  avatarSeed: string;
}

/** A user collection that has been shared publicly. */
export interface PublicCollection {
  /** Collection id. */
  id: string;
  /** Collection name. */
  name: string;
  /** Optional description. */
  description: string | null;
  /** The 10-character public share id. */
  shareId: string;
  /** How many firearms are in the collection. */
  itemCount: number;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** The firearms in the collection. */
  items: Firearm[];
}

/** Catalog completeness percentages from `/v1/stats/catalog-coverage`. */
export interface CatalogCoverage {
  /** Total firearms in the catalog. */
  total: number;
  /** Percentage with a line-art render, 0-100. */
  images: number;
  /** Average fill across the four core spec fields, 0-100. */
  specifications: number;
  /** Percentage with at least one caliber mapped, 0-100. */
  caliber: number;
  /** Percentage with a recorded empty weight, 0-100. */
  weight: number;
}

/** A technical drawing or document for a firearm. */
export interface FirearmSchematic {
  /** Schematic id. */
  id: number;
  /** The firearm this belongs to. */
  firearmId: string;
  /** Drawing title. */
  title: string;
  /** What the document is. */
  type: SchematicType;
  /** Absolute URL of the document. */
  url: string;
  /** File format, e.g. `pdf` or `png`. */
  format?: string | null;
  /** Document revision, where the maker states one. */
  version?: string | null;
  /** Who produced the document. */
  manufacturer?: string | null;
  /** Where the drawing came from. */
  source?: string | null;
  sourceUrl?: string | null;
  author?: string | null;
  license?: string | null;
  /** ISO-8601 creation timestamp. */
  createdAt?: string;
}

/** A firearm ranked by recorded view activity. */
export interface PopularFirearm {
  /** Firearm slug. */
  id: string;
  /** Display name. */
  name: string;
  /** Views recorded in the requested window. */
  viewCount: number;
}

/**
 * Request and response shapes shared by the transport and every resource.
 *
 * Kept apart from `http-client.ts` so the class file is orchestration only,
 * and so a consumer can import the types without pulling the client in.
 *
 * @module
 */

import type { AuthConfig } from './auth.js';
import type { RetryConfig } from './retry.js';
import type { ETagStore } from './etag-cache.js';

/** A value the query serialiser accepts. */
export type QueryValue = string | number | boolean | readonly string[] | null | undefined;


/** Configuration accepted by the {@link HttpClient} constructor. */
export interface HttpClientConfig {
  /** Base URL for all API requests. Trailing slashes are stripped. @defaultValue `"https://api.gunspec.io"` */
  baseUrl?: string;
  /** Default request timeout in milliseconds. @defaultValue `30_000` */
  timeout?: number;
  /** Extra headers merged into every outgoing request. */
  headers?: Record<string, string>;
  /** Authentication options. */
  auth?: AuthConfig;
  /** Retry / backoff options. */
  retry?: RetryConfig;
  /**
   * Send `If-None-Match` on GETs and serve the held body on a `304`.
   * `true` uses an in-memory LRU; pass an {@link ETagStore} to persist.
   */
  etagCache?: boolean | ETagStore;
  /** Permit an API key over plain `http://` to a non-loopback host. */
  allowInsecure?: boolean;
  /** A `fetch` implementation to use instead of the global one. */
  fetch?: typeof fetch;
}

/** Describes a single HTTP request to be executed by the client. */
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** URL path relative to the base URL. Must start with `/`. */
  path: string;
  /**
   * Query string parameters. `undefined` values are omitted, arrays become
   * repeated keys, booleans are stringified.
   */
  query?: Record<string, QueryValue>;
  /** JSON request body (automatically stringified). */
  body?: unknown;
  /** Per-request header overrides. */
  headers?: Record<string, string>;
  /** Per-request timeout in milliseconds. */
  timeout?: number;
  /** An external `AbortSignal` composed with the internal timeout. */
  signal?: AbortSignal;
  /** An `ETag` from an earlier response; sent as `If-None-Match`. */
  ifNoneMatch?: string;
}

/** Metadata every response carries, whatever its body. */
export interface ResponseMeta {
  /** HTTP status code. */
  readonly status: number;
  /** Raw response headers. */
  readonly headers: Headers;
  /** The `X-Request-Id` response header. */
  readonly requestId: string;
  /** Parsed rate limit headers. */
  readonly rateLimit: RateLimitInfo;
  /** The `ETag` header, when the endpoint supports conditional requests. */
  readonly etag: string | null;
  /** The `Cache-Control` header: how long this answer may be kept. */
  readonly cacheControl: string | null;
}

/** Unwrapped API response for endpoints that return a single resource. */
export interface APIResponse<T> extends ResponseMeta {
  /** The unwrapped response payload. */
  readonly data: T;
  /** `true` when the API answered `304` and the body came from the ETag cache. */
  readonly fromCache: boolean;
}

/** Unwrapped API response for endpoints that return a paginated list. */
export interface PaginatedResponse<T> extends ResponseMeta {
  readonly data: T[];
  readonly pagination: PaginationMeta;
  /** Facts about the whole collection a single page cannot carry. */
  readonly meta?: Record<string, unknown>;
  readonly fromCache: boolean;
}

/**
 * A conditional GET's outcome: either a fresh body, or `304` with no body
 * because the tag the caller sent still matches.
 */
export type ConditionalResponse<T> =
  | (APIResponse<T> & { readonly notModified: false })
  | (ResponseMeta & { readonly notModified: true; readonly status: 304 });

/** A response whose body is bytes rather than an envelope (SVG, GLB, images). */
export interface RawResponse extends ResponseMeta {
  readonly body: Uint8Array;
  readonly contentType: string | null;
  /** The URL the bytes came from, after any redirect to the CDN. */
  readonly url: string;
}

/** Pagination metadata included in list responses. */
export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  /** Same value as `limit`, in the request's own vocabulary. */
  readonly per_page?: number;
  /** Total matching items (omitted on plans that do not report it). */
  readonly total?: number;
  readonly totalPages?: number;
}

/**
 * What the response said about your allowance.
 *
 * The daily fields are the real ones. The per-minute three are always `null`
 * against this API and always were: the edge limiter reports whether a request
 * was allowed, not how much of the minute is left, so `X-RateLimit-*` is sent
 * by nothing. They are kept so that reading them keeps compiling, and will go
 * in the next major.
 */
export interface RateLimitInfo {
  /** @deprecated Always `null`: the API sends no `X-RateLimit-Limit`. Use {@link dailyLimit}. */
  readonly limit: number | null;
  /** @deprecated Always `null`: the API sends no `X-RateLimit-Remaining`. Use {@link dailyRemaining}. */
  readonly remaining: number | null;
  /** @deprecated Always `null`: the API sends no `X-RateLimit-Reset`. Use {@link dailyReset}. */
  readonly reset: number | null;
  /** Requests your plan allows per day, or `null` on a plan with no daily ceiling. */
  readonly dailyLimit: number | null;
  /**
   * Requests left today.
   *
   * Pace against it rather than settle on it: the API serves it from a short
   * cache while you are well under the cap and reads it live once you are near
   * one. `GET /v1/me/usage` is the figure to reconcile against.
   */
  readonly dailyRemaining: number | null;
  /** When the daily counter rolls over (UTC midnight), or `null` when none is sent. */
  readonly dailyReset: Date | null;
}

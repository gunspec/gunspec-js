/**
 * Response parsing helpers for the GunSpec HTTP client.
 *
 * Extracts metadata (rate limit headers, request ID, cache headers), unwraps
 * the `{ success, data }` envelope, and maps error responses to the
 * appropriate {@link APIError} subclass. Extracted from the
 * {@link HttpClient} so the transport class can focus on orchestration.
 *
 * @module
 */

import { createAPIError, GunSpecError, type ErrorEnvelope } from './errors/index.js';
import type { PaginationMeta, RateLimitInfo } from './http-client.js';

/**
 * Parse rate limit headers from a `Headers` object.
 */
export function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  const parse = (name: string): number | null => {
    const raw = headers.get(name);
    if (raw === null) return null;
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
  };

  const reset = headers.get('X-Daily-Reset');
  const resetAt = reset === null ? null : new Date(reset);

  return {
    /* Parsed, not hardcoded to null, so a proxy in front of this API that does
       send them is still read. Against GunSpec itself all three are absent. */
    limit: parse('X-RateLimit-Limit'),
    remaining: parse('X-RateLimit-Remaining'),
    reset: parse('X-RateLimit-Reset'),
    dailyLimit: parse('X-Daily-Limit'),
    dailyRemaining: parse('X-Daily-Remaining'),
    dailyReset: resetAt !== null && !Number.isNaN(resetAt.getTime()) ? resetAt : null,
  };
}

/**
 * Extract the request ID from response headers.
 */
export function extractRequestId(headers: Headers): string {
  return headers.get('X-Request-Id') ?? '';
}

/** The two headers a cache needs. */
export interface CacheHeaders {
  readonly etag: string | null;
  readonly cacheControl: string | null;
}

/** Read `ETag` and `Cache-Control` off a response. */
export function readCacheHeaders(headers: Headers): CacheHeaders {
  return {
    etag: headers.get('ETag'),
    cacheControl: headers.get('Cache-Control'),
  };
}

/**
 * Parse an error response body and throw the appropriate {@link APIError}.
 */
export async function throwAPIError(response: Response, requestId: string): Promise<never> {
  let body: ErrorEnvelope | null = null;

  try {
    body = (await response.json()) as ErrorEnvelope;
  } catch {
    // Body may be empty or not JSON - proceed with null body.
  }

  throw createAPIError(response.status, body, requestId, response.headers);
}

/** The single-resource envelope. */
interface SingleEnvelope<T> {
  success: boolean;
  data: T;
}

/** The list envelope. */
interface ListEnvelope<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  meta?: Record<string, unknown>;
}

/**
 * Parse a response body the API sent as a single-resource envelope.
 *
 * A body that is not JSON, or JSON without `data`, is reported as a
 * {@link GunSpecError} rather than surfacing as `undefined` downstream: that
 * happens when the endpoint returns bytes (an SVG, a GLB) and the caller used
 * the JSON path by mistake.
 */
export function parseEnvelope<T>(body: string, contentType: string | null): SingleEnvelope<T> {
  const parsed = parseJsonBody(body, contentType);
  if (typeof parsed !== 'object' || parsed === null || !('data' in parsed)) {
    throw new GunSpecError('Response body is not a GunSpec envelope (missing "data")');
  }
  return parsed as SingleEnvelope<T>;
}

/** Parse a response body the API sent as a list envelope. */
export function parsePaginatedEnvelope<T>(body: string, contentType: string | null): ListEnvelope<T> {
  const parsed = parseEnvelope<T[]>(body, contentType) as Partial<ListEnvelope<T>>;
  if (!Array.isArray(parsed.data) || typeof parsed.pagination !== 'object' || parsed.pagination === null) {
    throw new GunSpecError('Response body is not a paginated GunSpec envelope (missing "pagination")');
  }
  return parsed as ListEnvelope<T>;
}

function parseJsonBody(body: string, contentType: string | null): unknown {
  try {
    return JSON.parse(body);
  } catch {
    const kind = contentType ? ` (${contentType})` : '';
    throw new GunSpecError(`Response body is not JSON${kind}. Use getText() or getBytes() for binary endpoints.`);
  }
}

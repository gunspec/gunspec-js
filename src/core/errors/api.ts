/**
 * Errors the API answered with: one class per status it documents.
 *
 * Every one carries `code` (the family, stable forever) and `reason` (the
 * situation, what a program branches on). See {@link ErrorReason}.
 *
 * @module
 */

import { ERROR_REASONS, isErrorReason, type ErrorReason } from '../../types/error-reasons.js';
import { GunSpecError } from './base.js';
import { defaultReasonFor } from './reasons.js';

/**
 * Extra fields an API error may carry beyond status, code and message.
 */
export interface APIErrorExtra {
  /** The specific situation, from the response body's `error.reason`. */
  reason?: string;
  /** Endpoint-specific detail: validation issues, `requiredTier`, `maxBytes`. */
  details?: Record<string, unknown>;
  /** Seconds to wait before retrying, from `Retry-After`. */
  retryAfter?: number | null;
}

/**
 * An error returned by the GunSpec API with an HTTP status code.
 *
 * Subclasses are created for well-known status codes (401, 403, 404, ...).
 * For any other status code the base `APIError` is thrown directly.
 */
export class APIError extends GunSpecError {
  static override readonly brand: string = 'APIError';
  override readonly name: string = 'APIError';

  /** HTTP status code returned by the API. */
  readonly status: number;

  /** Error family from the response body, e.g. `"NOT_FOUND"`. Never changes. */
  readonly code: string;

  /**
   * The specific situation, e.g. `"KEY_EXPIRED"` or `"PLAN_REQUIRED"`.
   *
   * Always populated: when the API sends no reason the SDK falls back to the
   * default for the status, so a `switch` on it never hits `undefined`.
   */
  readonly reason: ErrorReason;

  /** Endpoint-specific detail, when the API included any. */
  readonly details: Record<string, unknown> | undefined;

  /** Seconds to wait before retrying, from `Retry-After`, or `null`. */
  readonly retryAfter: number | null;

  /** The `X-Request-Id` header value, useful for support requests. */
  readonly requestId: string;

  /** Raw response headers for further inspection. */
  readonly headers: Headers;

  constructor(
    status: number,
    code: string,
    message: string,
    requestId: string,
    headers: Headers,
    extra: APIErrorExtra = {},
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.reason = isErrorReason(extra.reason) ? extra.reason : defaultReasonFor(status);
    this.details = extra.details;
    this.retryAfter = extra.retryAfter ?? null;
    this.requestId = requestId;
    this.headers = headers;
  }

  /** The API's own one-line advice for this reason. */
  get action(): string {
    return ERROR_REASONS[this.reason].action;
  }

  /**
   * A plain object safe to log or serialise. Never includes the API key,
   * which the SDK never stores on an error in the first place.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      status: this.status,
      code: this.code,
      reason: this.reason,
      message: this.message,
      requestId: this.requestId,
      ...(this.details !== undefined && { details: this.details }),
      ...(this.retryAfter !== null && { retryAfter: this.retryAfter }),
    };
  }
}

/**
 * Thrown when the API returns **400 Bad Request**.
 *
 * `reason` is `INVALID_PARAMETER` (with `details` naming each field),
 * `INVALID_JSON` or `INVALID_REQUEST`.
 */
export class BadRequestError extends APIError {
  static override readonly brand: string = 'BadRequestError';
  override readonly name: string = 'BadRequestError';

  constructor(code: string, message: string, requestId: string, headers: Headers, extra?: APIErrorExtra) {
    super(400, code, message, requestId, headers, extra);
  }
}

/**
 * Thrown when the API returns **401 Unauthorized**: the credential itself is
 * the problem, so presenting a different key can work.
 *
 * `reason` says which: `KEY_MISSING`, `KEY_INVALID`, `KEY_DISABLED`,
 * `KEY_EXPIRED`, `AUTH_REQUIRED` ...
 */
export class AuthenticationError extends APIError {
  static override readonly brand: string = 'AuthenticationError';
  override readonly name: string = 'AuthenticationError';

  constructor(code: string, message: string, requestId: string, headers: Headers, extra?: APIErrorExtra) {
    super(401, code, message, requestId, headers, extra);
  }
}

/**
 * Thrown when the API returns **403 Forbidden**: the key is valid and the
 * caller is not permitted. Reissuing a key changes nothing.
 *
 * `reason` says why: `PLAN_REQUIRED` (see {@link requiredTier}),
 * `ACCOUNT_SUSPENDED`, `KEY_ON_HOLD` (this free key kept calling after its
 * daily limit refused it and is paused until {@link retryAfter} seconds from
 * now; a paid plan lifts it at once), `KEY_NOT_LINKED_TO_ACCOUNT`, `KEY_NOT_LINKED_TO_SHOP`,
 * `SHOP_UNDER_REVIEW`, `NOT_OWNER`, `PAGINATION_DEPTH_EXCEEDED` ...
 */
export class PermissionError extends APIError {
  static override readonly brand: string = 'PermissionError';
  override readonly name: string = 'PermissionError';

  constructor(code: string, message: string, requestId: string, headers: Headers, extra?: APIErrorExtra) {
    super(403, code, message, requestId, headers, extra);
  }

  /** The plan this endpoint needs, when `reason` is `PLAN_REQUIRED`. */
  get requiredTier(): string | undefined {
    const tier = this.details?.requiredTier;
    return typeof tier === 'string' ? tier : undefined;
  }
}

/**
 * Thrown when the API returns **404 Not Found**.
 */
export class NotFoundError extends APIError {
  static override readonly brand: string = 'NotFoundError';
  override readonly name: string = 'NotFoundError';

  constructor(code: string, message: string, requestId: string, headers: Headers, extra?: APIErrorExtra) {
    super(404, code, message, requestId, headers, extra);
  }
}

/**
 * Thrown when the API returns **409 Conflict**, such as a slug already in use.
 */
export class ConflictError extends APIError {
  static override readonly brand: string = 'ConflictError';
  override readonly name: string = 'ConflictError';

  constructor(code: string, message: string, requestId: string, headers: Headers, extra?: APIErrorExtra) {
    super(409, code, message, requestId, headers, extra);
  }
}

/**
 * Thrown when the API returns **413 Payload Too Large**. `maxBytes` carries
 * the limit when the API reported one.
 */
export class PayloadTooLargeError extends APIError {
  static override readonly brand: string = 'PayloadTooLargeError';
  override readonly name: string = 'PayloadTooLargeError';

  constructor(code: string, message: string, requestId: string, headers: Headers, extra?: APIErrorExtra) {
    super(413, code, message, requestId, headers, extra);
  }

  /** The largest body this endpoint accepts, in bytes, if reported. */
  get maxBytes(): number | undefined {
    const n = this.details?.maxBytes;
    return typeof n === 'number' ? n : undefined;
  }
}

/** The two reasons that mean a day's allowance is spent: the plan's, and the share of it for the hosted MCP server. */
const DAILY_CAP_REASONS: ReadonlySet<string> = new Set(['DAILY_CAP_EXCEEDED', 'MCP_DAILY_CAP_EXCEEDED']);

/** The reason that means the plan's month is spent. */
const MONTHLY_CAP_REASON = 'MONTHLY_CAP_EXCEEDED';

/**
 * Thrown when the API returns **429 Too Many Requests**.
 *
 * `reason` distinguishes a per-minute limit (`RATE_LIMITED`, wait
 * {@link retryAfter} seconds) from the plan's daily allowance
 * (`DAILY_CAP_EXCEEDED`, resets at midnight UTC), the plan's monthly allowance
 * (`MONTHLY_CAP_EXCEEDED`, resets at midnight UTC on the 1st), a pagination
 * burst (`PAGINATION_BURST`) and a repeated data report
 * (`REPORT_RATE_LIMITED`).
 *
 * On a daily or monthly refusal {@link retryAfter} is the real time left until
 * the reset, up to a whole day or a whole month, and {@link dailyReset} or
 * {@link monthlyReset} says when as a `Date`. Nothing is served before then,
 * and a free key that keeps calling after being refused is paused, so stop and
 * resume at the reset. The SDK retries one of these only when the reset is
 * within `maxRetryAfterMs` (a call refused a second before midnight waits the
 * second and succeeds); a longer wait is surfaced at once, never slept through.
 */
export class RateLimitError extends APIError {
  static override readonly brand: string = 'RateLimitError';
  override readonly name: string = 'RateLimitError';

  constructor(
    code: string,
    message: string,
    requestId: string,
    headers: Headers,
    retryAfter: number | null,
    extra: APIErrorExtra = {},
  ) {
    super(429, code, message, requestId, headers, { ...extra, retryAfter });
  }

  /**
   * `true` when a day's allowance is spent and no short wait will help: the
   * plan's (`DAILY_CAP_EXCEEDED`) or the hosted MCP server's share of it
   * (`MCP_DAILY_CAP_EXCEEDED`). Only the daily refusals: the month is
   * {@link isMonthlyCap}, and a caller that wants "any allowance that resets
   * later" writes `isDailyCap || isMonthlyCap`.
   */
  get isDailyCap(): boolean {
    return DAILY_CAP_REASONS.has(this.reason);
  }

  /**
   * `true` when the plan's month is spent (`MONTHLY_CAP_EXCEEDED`): the
   * allowance belongs to the whole account, so every key is refused until the
   * reset, or until the plan changes.
   */
  get isMonthlyCap(): boolean {
    return this.reason === MONTHLY_CAP_REASON;
  }

  /**
   * The daily limit that was reached, per key, or `null` when this is not a
   * daily refusal or the API did not say. Read from the response body, then
   * the `X-Daily-Limit` header (`X-Daily-MCP-Limit` for the MCP share).
   */
  get dailyLimit(): number | null {
    if (!this.isDailyCap) return null;
    return this.readLimit(this.reason === 'MCP_DAILY_CAP_EXCEEDED' ? 'X-Daily-MCP-Limit' : 'X-Daily-Limit');
  }

  /**
   * When the daily counters return to zero (the next midnight UTC), or `null`
   * when this is not a daily refusal or the API did not say. Read from the
   * response body's `resetsAt`, then the `X-Daily-Reset` header
   * (`X-Daily-MCP-Reset` for the MCP share). The same instant as
   * `error.retryAfter` seconds from now, as a date a scheduler can sleep until.
   */
  get dailyReset(): Date | null {
    if (!this.isDailyCap) return null;
    return this.readReset(this.reason === 'MCP_DAILY_CAP_EXCEEDED' ? 'X-Daily-MCP-Reset' : 'X-Daily-Reset');
  }

  /**
   * The monthly allowance that was reached, for the whole account, or `null`
   * when this is not a monthly refusal or the API did not say. Read from the
   * response body, then the `X-Monthly-Limit` header.
   */
  get monthlyLimit(): number | null {
    if (!this.isMonthlyCap) return null;
    return this.readLimit('X-Monthly-Limit');
  }

  /**
   * When the monthly allowance returns to zero (midnight UTC on the 1st), or
   * `null` when this is not a monthly refusal or the API did not say. Read
   * from the response body's `resetsAt`, then the `X-Monthly-Reset` header.
   */
  get monthlyReset(): Date | null {
    if (!this.isMonthlyCap) return null;
    return this.readReset('X-Monthly-Reset');
  }

  /** The body's `limit` when it is a number, else the named header, else `null`. */
  private readLimit(header: string): number | null {
    const fromBody = this.details?.limit;
    if (typeof fromBody === 'number' && Number.isFinite(fromBody)) return fromBody;
    const raw = this.headers.get(header);
    const fromHeader = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(fromHeader) ? fromHeader : null;
  }

  /** The body's `resetsAt` when it parses as a date, else the named header, else `null`. */
  private readReset(header: string): Date | null {
    for (const value of [this.details?.resetsAt, this.headers.get(header)]) {
      if (typeof value !== 'string') continue;
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
    return null;
  }
}

/**
 * Thrown when the API returns **500 Internal Server Error**.
 */
export class InternalServerError extends APIError {
  static override readonly brand: string = 'InternalServerError';
  override readonly name: string = 'InternalServerError';

  constructor(code: string, message: string, requestId: string, headers: Headers, extra?: APIErrorExtra) {
    super(500, code, message, requestId, headers, extra);
  }
}

/**
 * Thrown when the API returns **503 Service Unavailable**: a dependency is
 * down (`DEPENDENCY_UNAVAILABLE`) or the API is paused (`MAINTENANCE`, wait
 * {@link retryAfter} seconds).
 */
export class ServiceUnavailableError extends APIError {
  static override readonly brand: string = 'ServiceUnavailableError';
  override readonly name: string = 'ServiceUnavailableError';

  constructor(code: string, message: string, requestId: string, headers: Headers, extra?: APIErrorExtra) {
    super(503, code, message, requestId, headers, extra);
  }
}

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
 * `ACCOUNT_SUSPENDED`, `KEY_NOT_LINKED_TO_ACCOUNT`, `KEY_NOT_LINKED_TO_SHOP`,
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

/**
 * Thrown when the API returns **429 Too Many Requests**.
 *
 * `reason` distinguishes a per-minute limit (`RATE_LIMITED`, wait
 * {@link retryAfter} seconds) from the plan's daily allowance
 * (`DAILY_CAP_EXCEEDED`, resets at midnight UTC), a pagination burst
 * (`PAGINATION_BURST`) and a repeated data report (`REPORT_RATE_LIMITED`).
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

  /** `true` when the day's allowance is spent and no short wait will help. */
  get isDailyCap(): boolean {
    return this.reason === 'DAILY_CAP_EXCEEDED';
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

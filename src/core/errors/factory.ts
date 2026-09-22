/**
 * Build the right {@link APIError} subclass from a response.
 *
 * @module
 */

import {
  APIError, BadRequestError, AuthenticationError, PermissionError, NotFoundError,
  ConflictError, PayloadTooLargeError, RateLimitError, InternalServerError,
  ServiceUnavailableError, type APIErrorExtra,
} from './api.js';

/**
 * Parse the `Retry-After` header value into seconds.
 *
 * Handles both delta-seconds (`120`) and HTTP-date formats
 * (`Wed, 21 Oct 2015 07:28:00 GMT`).
 */
export function parseRetryAfter(headers: Headers): number | null {
  const raw = headers.get('Retry-After');
  if (raw === null) return null;

  const seconds = Number(raw);
  if (!Number.isNaN(seconds) && seconds >= 0) return seconds;

  const date = Date.parse(raw);
  if (!Number.isNaN(date)) {
    const delta = Math.ceil((date - Date.now()) / 1000);
    return delta > 0 ? delta : 0;
  }

  return null;
}

/**
 * Error envelope returned by the GunSpec API on non-2xx responses.
 */
export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    reason?: string;
    details?: Record<string, unknown>;
    request_id?: string;
    [key: string]: unknown;
  };
}

/** Body fields that are neither the core four nor `request_id` are detail. */
function extractDetails(error: ErrorEnvelope['error']): Record<string, unknown> | undefined {
  const { code: _c, message: _m, reason: _r, request_id: _id, details, ...rest } = error;
  const merged = { ...(details ?? {}), ...rest };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

/**
 * Create the appropriate {@link APIError} subclass for the given HTTP status
 * code and response body.
 */
export function createAPIError(
  status: number,
  body: ErrorEnvelope | null,
  requestId: string,
  headers: Headers,
): APIError {
  const code = body?.error?.code ?? `HTTP_${status}`;
  const message = body?.error?.message ?? `Request failed with status ${status}`;
  const retryAfter = parseRetryAfter(headers);
  const extra: APIErrorExtra = {
    reason: body?.error?.reason,
    details: body?.error ? extractDetails(body.error) : undefined,
    retryAfter,
  };
  const id = requestId || body?.error?.request_id || '';

  switch (status) {
    case 400: return new BadRequestError(code, message, id, headers, extra);
    case 401: return new AuthenticationError(code, message, id, headers, extra);
    case 403: return new PermissionError(code, message, id, headers, extra);
    case 404: return new NotFoundError(code, message, id, headers, extra);
    case 409: return new ConflictError(code, message, id, headers, extra);
    case 413: return new PayloadTooLargeError(code, message, id, headers, extra);
    case 429: return new RateLimitError(code, message, id, headers, retryAfter, extra);
    case 500: return new InternalServerError(code, message, id, headers, extra);
    case 503: return new ServiceUnavailableError(code, message, id, headers, extra);
    default: return new APIError(status, code, message, id, headers, extra);
  }
}

/**
 * The reason an error falls back to when the API sent none, by status. It
 * mirrors the API's own default table so a `switch` on `reason` never meets
 * `undefined`.
 *
 * @module
 */

import type { ErrorReason } from '../../types/error-reasons.js';

/** The reason an error with none carries, by status, mirroring the API's own default. */
export function defaultReasonFor(status: number): ErrorReason {
  switch (status) {
    case 400: return 'INVALID_REQUEST';
    case 401: return 'AUTH_REQUIRED';
    case 403: return 'ACTION_NOT_ALLOWED';
    case 404: return 'RESOURCE_NOT_FOUND';
    case 409: return 'CONFLICT';
    case 413: return 'PAYLOAD_TOO_LARGE';
    case 429: return 'RATE_LIMITED';
    case 503: return 'DEPENDENCY_UNAVAILABLE';
    default: return 'INTERNAL_ERROR';
  }
}

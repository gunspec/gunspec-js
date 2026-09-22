// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Error types
// ---------------------------------------------------------------------------
// These interfaces describe the JSON error bodies returned by the
// GunSpec.io API when a request fails.
// ---------------------------------------------------------------------------

/**
 * The error object nested inside an {@link APIErrorResponse}.
 *
 * @example
 * ```ts
 * const body: ErrorBody = {
 *   code: 'NOT_FOUND',
 *   message: "Firearm 'nonexistent-slug' not found",
 * };
 * ```
 */
export interface ErrorBody {
  /**
   * Machine-readable error code.
   *
   * Known codes:
   * - `"NOT_FOUND"` -- Resource does not exist (HTTP 404).
   * - `"UNAUTHORIZED"` -- Authentication required (HTTP 401).
   * - `"FORBIDDEN"` -- Insufficient permissions (HTTP 403).
   * - `"RATE_LIMITED"` -- Too many requests (HTTP 429).
   * - `"VALIDATION_ERROR"` -- Request parameters failed validation (HTTP 400).
   */
  code: string;

  /** Human-readable error message. */
  message: string;

  /**
   * Optional validation details.
   *
   * Present on `VALIDATION_ERROR` responses; shape varies by endpoint.
   */
  details?: Record<string, unknown>;
}

/**
 * Standard API error response envelope.
 *
 * All non-2xx responses from the GunSpec.io API return this shape.
 *
 * @example
 * ```ts
 * // 404 response body
 * const response: APIErrorResponse = {
 *   success: false,
 *   error: {
 *     code: 'NOT_FOUND',
 *     message: "Firearm 'nonexistent-slug' not found",
 *   },
 * };
 * ```
 */
export interface APIErrorResponse {
  /** Always `false` for error responses. */
  success: false;

  /** The error details. */
  error: ErrorBody;
}

/**
 * Known API error codes as a string union.
 *
 * Use this to discriminate error types in `switch` statements or
 * type-narrowing logic.
 *
 * @example
 * ```ts
 * function handleError(code: APIErrorCode) {
 *   switch (code) {
 *     case 'NOT_FOUND':
 *       console.log('Resource not found');
 *       break;
 *     case 'RATE_LIMITED':
 *       console.log('Slow down!');
 *       break;
 *   }
 * }
 * ```
 */
export type APIErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR';

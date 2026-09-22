/**
 * Errors raised before or instead of an API answer: the network, the clock,
 * or the client's own configuration.
 *
 * @module
 */

import { GunSpecError } from './base.js';

/**
 * Thrown when a network-level failure prevents the request from completing.
 *
 * This covers DNS resolution errors, connection resets, and any other
 * `TypeError` thrown by the native `fetch` implementation.
 */
export class ConnectionError extends GunSpecError {
  static override readonly brand: string = 'ConnectionError';
  override readonly name: string = 'ConnectionError';

  /** The original error thrown by `fetch`. */
  readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.cause = cause;
  }
}

/**
 * Thrown when a request exceeds the configured timeout.
 */
export class TimeoutError extends GunSpecError {
  static override readonly brand: string = 'TimeoutError';
  override readonly name: string = 'TimeoutError';

  /** The timeout duration in milliseconds that was exceeded. */
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Thrown when the client is configured in a way that would leak the
 * credential or cannot work: an API key over plain `http://` to a remote host,
 * or a base URL that is not a URL, both before any request is sent. Also
 * thrown in a browser when an endpoint redirects under the `X-API-Key` scheme,
 * because the browser hides where the redirect goes and would carry the header
 * there.
 */
export class ConfigurationError extends GunSpecError {
  static override readonly brand: string = 'ConfigurationError';
  override readonly name: string = 'ConfigurationError';
}

/**
 * Thrown before any request is sent when an argument cannot be placed in a
 * request as given. An id of `''`, `.` or `..` is the case that matters: URL
 * parsing collapses such a segment, so `webhooks.test('..')` would otherwise
 * post to `/v1/me/test` rather than fail.
 */
export class InvalidArgumentError extends GunSpecError {
  static override readonly brand: string = 'InvalidArgumentError';
  override readonly name: string = 'InvalidArgumentError';
}

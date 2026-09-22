/**
 * Error hierarchy for the GunSpec SDK.
 *
 * All SDK errors extend {@link GunSpecError} so consumers can catch them
 * uniformly. HTTP errors are mapped to a subclass of {@link APIError} by
 * {@link createAPIError}.
 *
 * @module
 */

export { GunSpecError } from './base.js';
export {
  APIError,
  BadRequestError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ConflictError,
  PayloadTooLargeError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
} from './api.js';
export type { APIErrorExtra } from './api.js';
export { ConnectionError, TimeoutError, ConfigurationError } from './transport.js';
export { createAPIError, parseRetryAfter } from './factory.js';
export type { ErrorEnvelope } from './factory.js';
export { defaultReasonFor } from './reasons.js';

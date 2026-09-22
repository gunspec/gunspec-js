/**
 * Core barrel for the GunSpec SDK: transport, auth, errors, retry,
 * pagination, conditional-request cache and webhook verification.
 *
 * @module
 */

export { HttpClient } from './http-client.js';
export type {
  HttpClientConfig,
  RequestConfig,
  APIResponse,
  PaginatedResponse,
  ConditionalResponse,
  RawResponse,
  ResponseMeta,
  PaginationMeta,
  RateLimitInfo,
} from './http-client.js';

export { resolveApiKey, buildAuthHeaders, maskApiKey, assertTransportSecurity } from './auth.js';
export type { AuthConfig, AuthScheme } from './auth.js';

export {
  GunSpecError,
  APIError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  BadRequestError,
  ConflictError,
  PayloadTooLargeError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  ConnectionError,
  TimeoutError,
  ConfigurationError,
  createAPIError,
  parseRetryAfter,
} from './errors/index.js';
export type { APIErrorExtra, ErrorEnvelope } from './errors/index.js';

export { resolveRetryConfig, isRetryable, computeDelay, withRetry, sleep } from './retry.js';
export type { RetryConfig, ResolvedRetryConfig } from './retry.js';

export { Page, createPage } from './pagination.js';
export type { PageFetcher } from './pagination.js';

export { MemoryETagStore, credentialFingerprint, cacheKeyFor } from './etag-cache.js';
export type { ETagStore, CachedEntry } from './etag-cache.js';

export {
  WEBHOOK_HEADERS,
  WebhookSignatureError,
  parseSignatureHeader,
  signWebhookPayload,
  verifyWebhookSignature,
  constructWebhookEvent,
} from './webhook-signature.js';
export type { WebhookEvent, VerifyOptions } from './webhook-signature.js';

export { serialiseQuery, buildUrl } from './request-builder.js';
export { parseRateLimitHeaders, extractRequestId, readCacheHeaders } from './response.js';
export type { CacheHeaders } from './response.js';

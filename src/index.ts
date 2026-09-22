// Client
export { GunSpec } from './client'
export type { ClientOptions } from './client'

// Core - HTTP
export { HttpClient } from './core/http-client'
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
  QueryValue,
} from './core/http-client'

// Core - Retry
export type { RetryConfig, ResolvedRetryConfig } from './core/retry'

// Core - Pagination
export { Page, createPage } from './core/pagination'
export type { PageFetcher } from './core/pagination'

// Core - Auth
export { resolveApiKey, buildAuthHeaders, maskApiKey, assertTransportSecurity } from './core/auth'
export type { AuthConfig, AuthScheme } from './core/auth'

// Core - Conditional requests
export { MemoryETagStore } from './core/etag-cache'
export type { ETagStore, CachedEntry } from './core/etag-cache'

// Core - Webhook verification
export {
  WEBHOOK_HEADERS,
  WebhookSignatureError,
  parseSignatureHeader,
  signWebhookPayload,
  verifyWebhookSignature,
  constructWebhookEvent,
} from './core/webhook-signature'
export type { WebhookEvent, VerifyOptions } from './core/webhook-signature'

// Errors
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
} from './core/errors'
export type { APIErrorExtra, ErrorEnvelope } from './core/errors'

// Resources
export {
  FirearmsResource,
  ManufacturersResource,
  CalibersResource,
  CategoriesResource,
  StatsResource,
  GameResource,
  GameStatsResource,
  AmmunitionResource,
  CountriesResource,
  ConflictsResource,
  ContentResource,
  DocsResource,
  CollectionsResource,
  AttachmentsResource,
  InterfacesResource,
  PlatformsResource,
  VendorResource,
  DataQualityResource,
  FavoritesResource,
  ReportsResource,
  SupportResource,
  WebhooksResource,
  UsageResource,
} from './resources'

// Types - every model, parameter and generated contract
export * from './types'

// Version
export { VERSION } from './version'

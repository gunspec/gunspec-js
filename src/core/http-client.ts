/**
 * HTTP transport layer for the GunSpec SDK.
 *
 * Uses the native `fetch` API (available in Node 18+, Deno, Bun, Cloudflare
 * Workers, and modern browsers) with zero external dependencies.
 *
 * @module
 */

import { resolveApiKey, buildAuthHeaders, assertTransportSecurity, maskApiKey, type AuthScheme } from './auth.js';
import { ConnectionError, TimeoutError } from './errors/index.js';
import { resolveRetryConfig, withRetry, type ResolvedRetryConfig } from './retry.js';
import { buildUrl } from './request-builder.js';
import {
  parseRateLimitHeaders, extractRequestId, throwAPIError, readCacheHeaders,
  parseEnvelope, parsePaginatedEnvelope,
} from './response.js';
import { composeSignals } from './signals.js';
import { MemoryETagStore, cacheKeyFor, credentialFingerprint, type ETagStore } from './etag-cache.js';
import type {
  HttpClientConfig, RequestConfig, ResponseMeta, APIResponse, PaginatedResponse,
  ConditionalResponse, RawResponse,
} from './types.js';

export type {
  HttpClientConfig, RequestConfig, ResponseMeta, APIResponse, PaginatedResponse,
  ConditionalResponse, RawResponse, PaginationMeta, RateLimitInfo, QueryValue,
} from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://api.gunspec.io';
const DEFAULT_TIMEOUT_MS = 30_000;
const SDK_USER_AGENT = '@buun_group/gunspec-sdk';

/** What resource methods pass: an object whose values are query-serialisable. */
type Query = RequestConfig['query'] | object;

const asQuery = (q: Query): RequestConfig['query'] => q as RequestConfig['query'];

// ---------------------------------------------------------------------------
// HttpClient
// ---------------------------------------------------------------------------

/**
 * Low-level HTTP client for the GunSpec API.
 *
 * Handles URL construction, authentication headers, timeouts, envelope
 * unwrapping, error mapping, retries with backoff, and conditional requests.
 * Most consumers should use the high-level `GunSpec` client instead.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly apiKey: string | undefined;
  private readonly authScheme: AuthScheme;
  private readonly retryConfig: ResolvedRetryConfig;
  private readonly store: ETagStore | null;
  private readonly fingerprint: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.defaultTimeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
    this.apiKey = resolveApiKey(config.auth ?? {});
    this.authScheme = config.auth?.scheme ?? 'x-api-key';
    this.retryConfig = resolveRetryConfig(config.retry);
    this.store = config.etagCache === true ? new MemoryETagStore()
      : config.etagCache ? config.etagCache : null;
    this.fingerprint = credentialFingerprint(this.apiKey);
    this.fetchImpl = config.fetch ?? fetch;

    assertTransportSecurity(this.baseUrl, this.apiKey !== undefined, config.allowInsecure ?? false);

    this.defaultHeaders = {
      'Accept': 'application/json',
      'User-Agent': SDK_USER_AGENT,
      ...config.headers,
    };
  }

  /** Whether a credential will be sent. The key itself is never exposed. */
  get isAuthenticated(): boolean {
    return this.apiKey !== undefined;
  }

  /**
   * What a log line or `JSON.stringify` sees. The key is masked here because
   * a client object ends up in debug output more often than anyone intends.
   */
  toJSON(): Record<string, unknown> {
    return {
      baseUrl: this.baseUrl,
      timeout: this.defaultTimeout,
      apiKey: maskApiKey(this.apiKey),
      authScheme: this.authScheme,
      retry: this.retryConfig,
      etagCache: this.store !== null,
    };
  }

  /** Absolute URL for a path, for links the caller renders rather than fetches. */
  urlFor(path: string, query?: Query): string {
    return buildUrl(this.baseUrl, path, asQuery(query));
  }

  /** Execute a request and return the unwrapped single-resource response. */
  async request<T>(config: RequestConfig): Promise<APIResponse<T>> {
    return withRetry(() => this.executeRequest<T>(config), config.method, this.retryConfig, config.signal);
  }

  /** Execute a request and return the unwrapped paginated response. */
  async requestPaginated<T>(config: RequestConfig): Promise<PaginatedResponse<T>> {
    return withRetry(() => this.executePaginatedRequest<T>(config), config.method, this.retryConfig, config.signal);
  }

  /**
   * Execute a GET with the caller's own `If-None-Match`, surfacing a `304`
   * instead of a body. Use this when you keep the cache yourself; the
   * `etagCache` option does the same automatically.
   */
  async requestConditional<T>(config: RequestConfig): Promise<ConditionalResponse<T>> {
    return withRetry(() => this.executeConditional<T>(config), config.method, this.retryConfig, config.signal);
  }

  /** Execute a request whose body is bytes rather than an envelope. */
  async requestRaw(config: RequestConfig): Promise<RawResponse> {
    return withRetry(async () => {
      const response = await this.doFetch({ ...config, headers: { Accept: '*/*', ...config.headers } });
      const requestId = extractRequestId(response.headers);
      if (!response.ok) await throwAPIError(response, requestId);
      const body = new Uint8Array(await response.arrayBuffer());
      return {
        body,
        contentType: response.headers.get('Content-Type'),
        url: response.url,
        ...this.metaFor(response, requestId),
      };
    }, config.method, this.retryConfig, config.signal);
  }

  /**
   * Follow nothing: return where a redirecting endpoint points. In a browser
   * a cross-origin redirect is opaque and this returns `null`.
   */
  async resolveRedirect(path: string, query?: Query): Promise<string | null> {
    const response = await this.doFetch({ method: 'GET', path, query: asQuery(query) }, 'manual');
    if (response.status >= 300 && response.status < 400) return response.headers.get('Location');
    if (!response.ok) await throwAPIError(response, extractRequestId(response.headers));
    return null;
  }

  async get<T>(path: string, query?: Query): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'GET', path, query: asQuery(query) });
  }

  async getPaginated<T>(path: string, query?: Query): Promise<PaginatedResponse<T>> {
    return this.requestPaginated<T>({ method: 'GET', path, query: asQuery(query) });
  }

  /** GET an endpoint that answers with text (an SVG, a CSV). */
  async getText(path: string, query?: Query): Promise<string> {
    const raw = await this.requestRaw({ method: 'GET', path, query: asQuery(query) });
    return new TextDecoder().decode(raw.body);
  }

  /** GET an endpoint that answers with binary content (a GLB, an image). */
  async getBytes(path: string, query?: Query): Promise<RawResponse> {
    return this.requestRaw({ method: 'GET', path, query: asQuery(query) });
  }

  async post<T>(path: string, body?: unknown, query?: Query): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'POST', path, body, query: asQuery(query) });
  }

  async put<T>(path: string, body?: unknown, query?: Query): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'PUT', path, body, query: asQuery(query) });
  }

  async patch<T>(path: string, body?: unknown, query?: Query): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'PATCH', path, body, query: asQuery(query) });
  }

  async delete<T>(path: string, query?: Query): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'DELETE', path, query: asQuery(query) });
  }

  // -----------------------------------------------------------------------
  // Internal execution
  // -----------------------------------------------------------------------

  private metaFor(response: Response, requestId: string): ResponseMeta {
    return {
      status: response.status,
      headers: response.headers,
      requestId,
      rateLimit: parseRateLimitHeaders(response.headers),
      ...readCacheHeaders(response.headers),
    };
  }

  /**
   * Fetch, consulting the ETag store on a GET: send the held tag, and on a
   * `304` hand back the held body as though it were the response.
   */
  private async fetchWithCache(config: RequestConfig): Promise<{ response: Response; body: string; fromCache: boolean }> {
    const cacheable = this.store !== null && config.method === 'GET' && config.ifNoneMatch === undefined;
    const key = cacheKeyFor(this.fingerprint, buildUrl(this.baseUrl, config.path, config.query));
    const held = cacheable ? await this.store!.get(key) : undefined;

    const response = await this.doFetch(held ? { ...config, ifNoneMatch: held.etag } : config);
    const requestId = extractRequestId(response.headers);

    if (response.status === 304 && held) {
      return { response, body: held.body, fromCache: true };
    }
    if (!response.ok) await throwAPIError(response, requestId);

    const body = await response.text();
    const etag = response.headers.get('ETag');
    if (cacheable && etag) await this.store!.set(key, { etag, body, storedAt: Date.now() });
    return { response, body, fromCache: false };
  }

  private async executeRequest<T>(config: RequestConfig): Promise<APIResponse<T>> {
    const { response, body, fromCache } = await this.fetchWithCache(config);
    const json = parseEnvelope<T>(body, response.headers.get('Content-Type'));
    return { data: json.data, fromCache, ...this.metaFor(response, extractRequestId(response.headers)) };
  }

  private async executePaginatedRequest<T>(config: RequestConfig): Promise<PaginatedResponse<T>> {
    const { response, body, fromCache } = await this.fetchWithCache(config);
    const json = parsePaginatedEnvelope<T>(body, response.headers.get('Content-Type'));
    return {
      data: json.data,
      pagination: json.pagination,
      ...(json.meta !== undefined && { meta: json.meta }),
      fromCache,
      ...this.metaFor(response, extractRequestId(response.headers)),
    };
  }

  private async executeConditional<T>(config: RequestConfig): Promise<ConditionalResponse<T>> {
    const response = await this.doFetch(config);
    const requestId = extractRequestId(response.headers);
    if (response.status === 304) {
      return { notModified: true, ...this.metaFor(response, requestId), status: 304 };
    }
    if (!response.ok) await throwAPIError(response, requestId);
    const json = parseEnvelope<T>(await response.text(), response.headers.get('Content-Type'));
    return { notModified: false, data: json.data, fromCache: false, ...this.metaFor(response, requestId) };
  }

  /** Perform the raw `fetch` call with merged headers, query string, timeout, and body. */
  private async doFetch(config: RequestConfig, redirect: 'follow' | 'manual' | 'error' = 'follow'): Promise<Response> {
    const url = buildUrl(this.baseUrl, config.path, config.query);
    const timeoutMs = config.timeout ?? this.defaultTimeout;
    const { signal, cleanup } = composeSignals(timeoutMs, config.signal);

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...buildAuthHeaders(this.apiKey, this.authScheme),
      ...config.headers,
    };
    if (config.body !== undefined) headers['Content-Type'] = 'application/json';
    if (config.ifNoneMatch !== undefined) headers['If-None-Match'] = config.ifNoneMatch;

    try {
      return await this.fetchImpl(url, {
        method: config.method,
        headers,
        body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
        signal,
        redirect,
      });
    } catch (error: unknown) {
      if (error instanceof TimeoutError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (config.signal?.aborted) throw error;
        throw new TimeoutError(timeoutMs);
      }
      throw new ConnectionError(error instanceof Error ? error.message : 'Network request failed', error);
    } finally {
      cleanup();
    }
  }
}

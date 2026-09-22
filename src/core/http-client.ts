/**
 * HTTP transport layer for the GunSpec SDK.
 *
 * Uses the native `fetch` API (available in Node 18+, Deno, Bun, Cloudflare
 * Workers, and modern browsers) with zero external dependencies.
 *
 * @module
 */

import { resolveApiKey, buildAuthHeaders, assertTransportSecurity, maskApiKey, type AuthScheme } from './auth.js';
import { ConfigurationError, ConnectionError, GunSpecError, TimeoutError } from './errors/index.js';
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

/** Most redirects one request follows before giving up, as a loop guard. */
const MAX_REDIRECTS = 5;

/** Statuses that carry a `Location` the fetch standard would follow. */
const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);

/** Headers that carry the credential, lowercased; dropped on a hop to another origin. */
const CREDENTIAL_HEADERS: ReadonlySet<string> = new Set(['x-api-key', 'authorization']);

/**
 * Node's `util.inspect` hook, by its registered name, so `console.log(client)`
 * shows the masked view without the package importing `node:util`.
 */
const INSPECT = Symbol.for('nodejs.util.inspect.custom');

/**
 * The page's own URL in a browser, which a relative base URL resolves
 * against. `undefined` elsewhere.
 */
function pageHref(): string | undefined {
  const location = (globalThis as { location?: { href?: unknown } }).location;
  return typeof location?.href === 'string' ? location.href : undefined;
}

/** `url` as an absolute URL, resolving a relative one against the page; `null` when it cannot be. */
function absoluteUrl(url: string): URL | null {
  try {
    return new URL(url, pageHref());
  } catch {
    return null;
  }
}

/** Release a redirect's body so the connection can be reused. */
async function discardBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Nothing to release, or already released.
  }
}

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
  /* The key and anything derived from it are ES private fields, so neither
     `util.inspect`, a debugger's property list nor `Object.keys` can reach
     them. A plain `private` is only a compile-time promise and printed the key
     in full from `console.log(client)`. */
  readonly #apiKey: string | undefined;
  #fingerprint: Promise<string | null> | undefined;
  private readonly authScheme: AuthScheme;
  private readonly retryConfig: ResolvedRetryConfig;
  private readonly store: ETagStore | null;
  private readonly fetchImpl: typeof fetch;
  /** Origin of the base URL; a redirect elsewhere is sent without the credential. */
  private readonly baseOrigin: string | null;

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.defaultTimeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
    this.#apiKey = resolveApiKey(config.auth ?? {});
    this.authScheme = config.auth?.scheme ?? 'x-api-key';
    this.retryConfig = resolveRetryConfig(config.retry);
    this.store = config.etagCache === true ? new MemoryETagStore()
      : config.etagCache ? config.etagCache : null;
    this.fetchImpl = config.fetch ?? fetch;
    this.baseOrigin = absoluteUrl(this.baseUrl || '/')?.origin ?? null;

    assertTransportSecurity(this.baseUrl, this.#apiKey !== undefined, config.allowInsecure ?? false);

    this.defaultHeaders = {
      'Accept': 'application/json',
      'User-Agent': SDK_USER_AGENT,
      ...config.headers,
    };
  }

  /** Whether a credential will be sent. The key itself is never exposed. */
  get isAuthenticated(): boolean {
    return this.#apiKey !== undefined;
  }

  /**
   * What a log line or `JSON.stringify` sees. The key is masked here because
   * a client object ends up in debug output more often than anyone intends.
   */
  toJSON(): Record<string, unknown> {
    return {
      baseUrl: this.baseUrl,
      timeout: this.defaultTimeout,
      apiKey: maskApiKey(this.#apiKey),
      authScheme: this.authScheme,
      retry: this.retryConfig,
      etagCache: this.store !== null,
    };
  }

  /** What `console.log` and `util.inspect` print in Node, Bun and Deno: the same masked view. */
  [INSPECT](): Record<string, unknown> {
    return this.toJSON();
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
    const fingerprint = this.store !== null && config.method === 'GET' && config.ifNoneMatch === undefined
      ? await (this.#fingerprint ??= credentialFingerprint(this.#apiKey))
      : null;
    /* No fingerprint means no WebCrypto to hash the key with: skip the cache
       rather than risk two keys sharing an entry. */
    const cacheable = fingerprint !== null;
    const key = cacheable ? cacheKeyFor(fingerprint, buildUrl(this.baseUrl, config.path, config.query)) : '';
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

  /**
   * The headers for one hop. `withCredential` is false on a hop to another
   * origin, which then carries every header but the key.
   */
  private headersFor(config: RequestConfig, withCredential: boolean, hasBody: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...buildAuthHeaders(this.#apiKey, this.authScheme),
      ...config.headers,
    };
    if (hasBody) headers['Content-Type'] = 'application/json';
    if (config.ifNoneMatch !== undefined) headers['If-None-Match'] = config.ifNoneMatch;
    if (!withCredential) {
      for (const name of Object.keys(headers)) {
        if (CREDENTIAL_HEADERS.has(name.toLowerCase())) delete headers[name];
      }
    }
    return headers;
  }

  /**
   * Perform the `fetch` call with merged headers, query string, timeout and
   * body, following redirects by hand.
   *
   * `fetch` follows redirects itself by default, and the fetch standard drops
   * `Authorization` on a cross-origin hop but not a custom header, so
   * `X-API-Key` used to reach whatever host a redirect named, in the clear if
   * that hop was `http:`. Every hop is therefore fetched with
   * `redirect: 'manual'`: the credential goes only to the base URL's origin,
   * an `https:` to `http:` hop is refused, and a chain stops after
   * {@link MAX_REDIRECTS}. A same-origin redirect behaves as it always did.
   *
   * `redirect` is `'manual'` for {@link resolveRedirect}, which wants the
   * first answer as it is.
   */
  private async doFetch(config: RequestConfig, redirect: 'follow' | 'manual' = 'follow'): Promise<Response> {
    let url = buildUrl(this.baseUrl, config.path, config.query);
    let method: string = config.method;
    let body = config.body !== undefined ? JSON.stringify(config.body) : undefined;
    const timeoutMs = config.timeout ?? this.defaultTimeout;
    const { signal, cleanup } = composeSignals(timeoutMs, config.signal);

    try {
      for (let hop = 0; ; hop++) {
        const withCredential = hop === 0 || absoluteUrl(url)?.origin === this.baseOrigin;
        const headers = this.headersFor(config, withCredential, body !== undefined);
        const init: RequestInit = { method, headers, body, signal, redirect: 'manual' };
        const response = await this.fetchImpl(url, init);
        if (redirect === 'manual') return response;

        /* A browser answers `redirect: 'manual'` with an opaque response: status
           0 and no Location, so the next hop cannot be checked. Without a
           custom credential header the browser can be left to follow it, since
           the fetch standard strips `Authorization` on a cross-origin hop and
           blocks an https page from loading http. With `X-API-Key` it cannot:
           the header would travel with the redirect, so the call is refused
           and the error names the scheme that is safe here. This costs a
           second request, which only happens in a browser on an endpoint that
           redirects. */
        if (response.type === 'opaqueredirect') {
          if (Object.keys(headers).some((name) => name.toLowerCase() === 'x-api-key')) {
            throw new ConfigurationError(
              'This endpoint redirects, and this runtime hides where to, so the SDK cannot keep the X-API-Key header ' +
                "off another host. Pass authScheme: 'bearer', whose header the runtime removes on a cross-origin redirect.",
            );
          }
          return await this.fetchImpl(url, { ...init, redirect: 'follow' });
        }

        const location = REDIRECT_STATUSES.has(response.status) ? response.headers.get('Location') : null;
        if (location === null) return response;

        const current = absoluteUrl(url);
        let next: URL;
        try {
          next = new URL(location, current ?? undefined);
        } catch {
          throw new ConnectionError(`Redirect to an unreadable Location: ${JSON.stringify(location)}`, undefined);
        }
        if (current?.protocol === 'https:' && next.protocol === 'http:') {
          throw new ConnectionError(
            `Refusing to follow a redirect from https to plain http (${next.origin}): the request would travel in the clear.`,
            undefined,
          );
        }
        if (hop >= MAX_REDIRECTS) {
          throw new ConnectionError(`Stopped after ${MAX_REDIRECTS} redirects without an answer`, undefined);
        }
        await discardBody(response);

        /* The method and body change exactly as the fetch standard changes
           them: a 303 becomes a GET, and so does a POST answered 301 or 302.
           A 307 or 308 repeats the request as it was. */
        if ((response.status === 303 && method !== 'HEAD') || ((response.status === 301 || response.status === 302) && method === 'POST')) {
          method = 'GET';
          body = undefined;
        }
        url = next.href;
      }
    } catch (error: unknown) {
      if (error instanceof GunSpecError) throw error;
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

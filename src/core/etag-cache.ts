/**
 * Conditional-request cache for the GunSpec SDK.
 *
 * The API answers `304 Not Modified` on its cacheable GETs when the client
 * sends the `ETag` it holds, and a 304 does not count against the plan's daily
 * cap. This module remembers the last body and tag per URL so the
 * {@link HttpClient} can send `If-None-Match` and serve the held copy on a
 * 304, which makes a polling mirror cost nothing while the catalog is quiet.
 *
 * The API shapes a body per plan, so a tag is only valid for the key that
 * fetched it. Every cache key therefore carries a fingerprint of the API key,
 * and a store shared between two differently keyed clients cannot cross-serve
 * a paid-tier body to a cheaper key.
 *
 * @module
 */

/** One held response. */
export interface CachedEntry {
  /** The `ETag` the API sent with this body. */
  readonly etag: string;
  /** The response body, verbatim. */
  readonly body: string;
  /** `Date.now()` when it was stored. */
  readonly storedAt: number;
}

/**
 * Where held responses live. The default is an in-memory LRU; supply your own
 * to persist across processes (a KV namespace, Redis, the filesystem). Both
 * methods may be synchronous or return a promise.
 */
export interface ETagStore {
  get(key: string): CachedEntry | undefined | Promise<CachedEntry | undefined>;
  set(key: string, entry: CachedEntry): void | Promise<void>;
}

/**
 * Bounded in-memory store with least-recently-used eviction.
 *
 * @example
 * ```ts
 * const client = new GunSpec({ etagCache: new MemoryETagStore(2000) });
 * ```
 */
export class MemoryETagStore implements ETagStore {
  private readonly entries = new Map<string, CachedEntry>();

  /**
   * @param maxEntries - Upper bound on held responses. Each holds one body,
   *   so size this to the working set you poll, not the whole catalog.
   */
  constructor(private readonly maxEntries: number = 500) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new RangeError('maxEntries must be a positive integer');
    }
  }

  get(key: string): CachedEntry | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) return undefined;
    // Re-insert to mark as most recently used.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry;
  }

  set(key: string, entry: CachedEntry): void {
    this.entries.delete(key);
    this.entries.set(key, entry);
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  /** Number of held responses. */
  get size(): number {
    return this.entries.size;
  }

  /** Drop everything. */
  clear(): void {
    this.entries.clear();
  }
}

/**
 * Non-reversible fingerprint of a credential for namespacing cache keys.
 *
 * FNV-1a over the key string. This is not a secret-grade hash and is not
 * meant to be: it only has to keep two keys' entries apart inside one
 * process, and it must be synchronous so the client can build keys without
 * awaiting WebCrypto on every request.
 */
export function credentialFingerprint(apiKey: string | undefined): string {
  if (!apiKey) return 'anon';
  let hash = 0x811c9dc5;
  for (let i = 0; i < apiKey.length; i++) {
    hash ^= apiKey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Build the store key for one GET. */
export function cacheKeyFor(fingerprint: string, url: string): string {
  return `${fingerprint} ${url}`;
}

/**
 * Authentication handler for the GunSpec SDK.
 *
 * Resolves an API key from an explicit option or the `GUNSPEC_API_KEY`
 * environment variable, produces the header map needed for every
 * authenticated request, and refuses configurations that would put the key
 * on the wire in the clear.
 *
 * @module
 */

import { ConfigurationError } from './errors/index.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Which header carries the key. Both are canonical and permanent on the API:
 * `X-API-Key` is what the docs lead with, `Authorization: Bearer` is what
 * generated clients and proxies expect. `X-API-Key` wins when both are sent.
 */
export type AuthScheme = 'x-api-key' | 'bearer';

/**
 * Options accepted by the authentication handler.
 */
export interface AuthConfig {
  /**
   * An explicit API key to use for all requests.
   *
   * When omitted or empty the handler falls back to the `GUNSPEC_API_KEY`
   * environment variable (Node.js / Deno / Bun `process.env`). `null` means
   * anonymous on purpose: no header is sent and the environment is not read,
   * which is how a test or a public-only caller opts out of a key the shell
   * happens to export.
   */
  apiKey?: string | null;

  /**
   * Header to carry the key in.
   *
   * @defaultValue `"x-api-key"`
   */
  scheme?: AuthScheme;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to read `GUNSPEC_API_KEY` from the runtime environment.
 *
 * Works in Node.js, Deno (with `--allow-env`), Bun, and Cloudflare Workers
 * (when the env variable is bound). Returns `undefined` in environments
 * where `process` or `Deno.env` are unavailable.
 */
function readEnvKey(): string | undefined {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.GUNSPEC_API_KEY;
    }
  } catch {
    // process may be defined but restricted (e.g. browser polyfill).
  }

  try {
    const g = globalThis as { Deno?: { env?: { get(key: string): string | undefined } } };
    if (typeof g.Deno !== 'undefined' && g.Deno.env) {
      return g.Deno.env.get('GUNSPEC_API_KEY');
    }
  } catch {
    // Deno.env.get throws if --allow-env is missing.
  }

  return undefined;
}

const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve the API key to use for authentication.
 *
 * Resolution order:
 * 1. `null` means anonymous: stop here.
 * 2. Explicit non-empty `apiKey` option passed to the constructor.
 * 3. `GUNSPEC_API_KEY` environment variable.
 * 4. `undefined` (anonymous / unauthenticated).
 */
export function resolveApiKey(config: AuthConfig): string | undefined {
  if (config.apiKey === null) return undefined;
  if (config.apiKey !== undefined && config.apiKey !== '') {
    return config.apiKey;
  }
  return readEnvKey();
}

/**
 * Build the authentication headers for a request.
 *
 * Returns an empty object when no key is available so the request proceeds
 * in anonymous mode.
 *
 * @remarks
 * The key value is **never** logged or serialised to avoid accidental
 * credential leakage.
 */
export function buildAuthHeaders(
  apiKey: string | undefined,
  scheme: AuthScheme = 'x-api-key',
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (apiKey !== undefined && apiKey !== '') {
    if (scheme === 'bearer') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      headers['X-API-Key'] = apiKey;
    }
  }
  return headers;
}

/**
 * Render a key for a log line: the first four and last four characters with
 * the middle elided, or `"(none)"`. Short keys are fully masked.
 */
export function maskApiKey(apiKey: string | undefined): string {
  if (!apiKey) return '(none)';
  if (apiKey.length <= 12) return '*'.repeat(apiKey.length);
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

/**
 * Refuse to send a key over a transport that would expose it.
 *
 * A base URL that is not `https:` puts the key in every request in the clear.
 * The loopback hosts are allowed, because that is how the SDK is pointed at a
 * local `wrangler dev`; a relative base is same-origin and left to the page;
 * anything else needs `allowInsecure: true` to say the caller knows what they
 * are doing.
 *
 * @throws {ConfigurationError} on a malformed URL or an insecure remote host.
 */
export function assertTransportSecurity(
  baseUrl: string,
  hasApiKey: boolean,
  allowInsecure: boolean,
): void {
  /* A relative base (`''`, `'/api'`) means same-origin: the page's own scheme
     carries the request, and a browser will not let a script see or choose
     it. Nothing to check. */
  if (baseUrl === '' || baseUrl.startsWith('/')) return;

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new ConfigurationError(`baseURL is not a valid URL: ${JSON.stringify(baseUrl)}`);
  }

  if (url.protocol === 'https:') return;
  if (!hasApiKey) return;
  if (allowInsecure) return;
  if (url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname)) return;

  throw new ConfigurationError(
    `Refusing to send an API key over ${url.protocol}// to ${url.hostname}. ` +
      'Use an https:// base URL, or pass allowInsecure: true if this is a trusted private network.',
  );
}

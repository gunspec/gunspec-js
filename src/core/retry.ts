/**
 * Retry logic with exponential backoff for the GunSpec SDK.
 *
 * Only **idempotent** HTTP methods (`GET`, `PUT`, `DELETE`) are retried
 * automatically.  Transient failures (timeouts, 429, 5xx) trigger a retry
 * after an exponentially increasing delay with +-20 % jitter.
 *
 * @module
 */

import { APIError, RateLimitError, TimeoutError, ConnectionError } from './errors/index.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for the retry behaviour.
 *
 * All fields are optional and fall back to sensible defaults.
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts (excluding the initial request).
   *
   * Set to `0` to disable retries entirely.
   *
   * @defaultValue `2`
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds before the first retry.
   *
   * @defaultValue `500`
   */
  initialDelayMs?: number;

  /**
   * Upper-bound delay in milliseconds.  The computed delay is capped at this
   * value regardless of how many retries have occurred.
   *
   * @defaultValue `8000`
   */
  maxDelayMs?: number;

  /**
   * Multiplier applied to the delay after each retry.
   *
   * @defaultValue `2`
   */
  multiplier?: number;

  /**
   * Longest `Retry-After` the SDK will honour, in milliseconds. A server that
   * asks for a longer wait (a daily cap resetting at midnight, a maintenance
   * window) gets the error surfaced to the caller instead of a sleeping
   * process.
   *
   * @defaultValue `30_000`
   */
  maxRetryAfterMs?: number;
}

/** Fully resolved retry configuration with all defaults applied. */
export interface ResolvedRetryConfig {
  readonly maxRetries: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly multiplier: number;
  readonly maxRetryAfterMs: number;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** Default retry configuration values. */
const DEFAULTS: ResolvedRetryConfig = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 8_000,
  multiplier: 2,
  maxRetryAfterMs: 30_000,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** HTTP methods that are safe to retry automatically. */
const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set(['GET', 'PUT', 'DELETE']);

/**
 * HTTP status codes that indicate a transient failure eligible for retry.
 *
 * - 408 Request Timeout
 * - 429 Too Many Requests
 * - 500 Internal Server Error
 * - 502 Bad Gateway
 * - 503 Service Unavailable
 * - 504 Gateway Timeout
 */
const RETRYABLE_STATUS_CODES: ReadonlySet<number> = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Resolve a partial {@link RetryConfig} into a fully populated
 * {@link ResolvedRetryConfig} by filling in defaults.
 */
export function resolveRetryConfig(config?: RetryConfig): ResolvedRetryConfig {
  return {
    maxRetries: config?.maxRetries ?? DEFAULTS.maxRetries,
    initialDelayMs: config?.initialDelayMs ?? DEFAULTS.initialDelayMs,
    maxDelayMs: config?.maxDelayMs ?? DEFAULTS.maxDelayMs,
    multiplier: config?.multiplier ?? DEFAULTS.multiplier,
    maxRetryAfterMs: config?.maxRetryAfterMs ?? DEFAULTS.maxRetryAfterMs,
  };
}

/**
 * Determine whether a given error is eligible for an automatic retry.
 *
 * @param error  - The error thrown by the HTTP layer.
 * @param method - The HTTP method of the failed request.
 * @returns `true` if the request should be retried.
 */
export function isRetryable(error: unknown, method: string): boolean {
  // Only retry idempotent methods to avoid duplicate side-effects.
  if (!IDEMPOTENT_METHODS.has(method.toUpperCase())) {
    return false;
  }

  // Network failures and timeouts are always retryable.
  if (error instanceof ConnectionError || error instanceof TimeoutError) {
    return true;
  }

  // API errors with specific transient status codes. A spent daily
  // allowance is a 429 that no backoff inside one process will outlast.
  if (error instanceof APIError) {
    if (error instanceof RateLimitError && error.isDailyCap) return false;
    return RETRYABLE_STATUS_CODES.has(error.status);
  }

  return false;
}

/**
 * Compute the delay in milliseconds before the next retry attempt.
 *
 * Uses exponential backoff with +-20 % jitter, capped at
 * {@link ResolvedRetryConfig.maxDelayMs}.
 *
 * For responses that carry a `Retry-After` header (429, 503) the returned
 * delay is the greater of the computed backoff and the server-requested wait.
 *
 * @param attempt - Zero-based retry attempt index (0 = first retry).
 * @param config  - Resolved retry configuration.
 * @param error   - The error that triggered the retry (used to read
 *                  `retryAfter` on 429 responses).
 * @returns Delay in milliseconds.
 */
export function computeDelay(
  attempt: number,
  config: ResolvedRetryConfig,
  error: unknown,
): number {
  // Base exponential delay.
  const base = config.initialDelayMs * Math.pow(config.multiplier, attempt);

  // Apply +-20 % jitter.
  const jitter = 1 + (Math.random() * 0.4 - 0.2);
  let delay = Math.min(base * jitter, config.maxDelayMs);

  // Honour Retry-After wherever the server sent one.
  if (error instanceof APIError && error.retryAfter !== null) {
    const retryAfterMs = error.retryAfter * 1000;
    delay = Math.max(delay, retryAfterMs);
  }

  return Math.round(delay);
}

/**
 * Wait for the specified number of milliseconds.
 *
 * The delay is abortable via an `AbortSignal` so that cancellation propagates
 * cleanly to in-flight retries.
 *
 * @param ms     - Duration to wait.
 * @param signal - Optional abort signal.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

/**
 * Execute an async function with automatic retries on transient failures.
 *
 * @typeParam T  - The return type of the function being retried.
 * @param fn     - The function to execute (and potentially retry).
 * @param method - The HTTP method, used to determine idempotency.
 * @param config - Retry configuration.
 * @param signal - Optional abort signal to cancel pending retries.
 * @returns The result of a successful invocation of `fn`.
 * @throws The last error encountered when all retry attempts are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  method: string,
  config: ResolvedRetryConfig,
  signal?: AbortSignal,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Don't retry if this is the last attempt or the error isn't retryable.
      const isLastAttempt = attempt === config.maxRetries;
      if (isLastAttempt || !isRetryable(error, method)) {
        throw error;
      }

      // A wait the server asked for that is longer than the caller will
      // tolerate is their decision to make, not ours to sleep through.
      if (error instanceof APIError && error.retryAfter !== null
        && error.retryAfter * 1000 > config.maxRetryAfterMs) {
        throw error;
      }

      const delay = computeDelay(attempt, config, error);
      await sleep(delay, signal);
    }
  }

  // Unreachable in practice, but satisfies the type checker.
  throw lastError;
}

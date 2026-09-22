import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isRetryable,
  computeDelay,
  resolveRetryConfig,
  withRetry,
  sleep,
} from '../../../src/core/retry';
import {
  APIError,
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
  ConnectionError,
  TimeoutError,
} from '../../../src/core/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHeaders(extra: Record<string, string> = {}): Headers {
  return new Headers(extra);
}

const DEFAULT_CONFIG = resolveRetryConfig();

// ---------------------------------------------------------------------------
// resolveRetryConfig
// ---------------------------------------------------------------------------

describe('resolveRetryConfig', () => {
  it('applies default values when no config is provided', () => {
    const config = resolveRetryConfig();
    expect(config.maxRetries).toBe(2);
    expect(config.initialDelayMs).toBe(500);
    expect(config.maxDelayMs).toBe(8000);
    expect(config.multiplier).toBe(2);
  });

  it('uses provided values', () => {
    const config = resolveRetryConfig({
      maxRetries: 5,
      initialDelayMs: 100,
      maxDelayMs: 2000,
      multiplier: 3,
    });
    expect(config.maxRetries).toBe(5);
    expect(config.initialDelayMs).toBe(100);
    expect(config.maxDelayMs).toBe(2000);
    expect(config.multiplier).toBe(3);
  });

  it('fills in missing fields with defaults', () => {
    const config = resolveRetryConfig({ maxRetries: 0 });
    expect(config.maxRetries).toBe(0);
    expect(config.initialDelayMs).toBe(500);
    expect(config.maxDelayMs).toBe(8000);
    expect(config.multiplier).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// isRetryable
// ---------------------------------------------------------------------------

describe('isRetryable', () => {
  describe('idempotent methods (GET, PUT, DELETE)', () => {
    const methods = ['GET', 'PUT', 'DELETE'];

    for (const method of methods) {
      it(`retries ConnectionError on ${method}`, () => {
        const err = new ConnectionError('network down', null);
        expect(isRetryable(err, method)).toBe(true);
      });

      it(`retries TimeoutError on ${method}`, () => {
        const err = new TimeoutError(5000);
        expect(isRetryable(err, method)).toBe(true);
      });

      it(`retries 429 RateLimitError on ${method}`, () => {
        const err = new RateLimitError('RATE_LIMITED', 'slow', 'req', makeHeaders(), 60);
        expect(isRetryable(err, method)).toBe(true);
      });

      it(`retries 500 InternalServerError on ${method}`, () => {
        const err = new InternalServerError('ISE', 'boom', 'req', makeHeaders());
        expect(isRetryable(err, method)).toBe(true);
      });

      it(`retries 502 APIError on ${method}`, () => {
        const err = new APIError(502, 'BAD_GATEWAY', 'bad gw', 'req', makeHeaders());
        expect(isRetryable(err, method)).toBe(true);
      });

      it(`retries 503 APIError on ${method}`, () => {
        const err = new APIError(503, 'UNAVAILABLE', 'down', 'req', makeHeaders());
        expect(isRetryable(err, method)).toBe(true);
      });

      it(`retries 504 APIError on ${method}`, () => {
        const err = new APIError(504, 'GATEWAY_TIMEOUT', 'timeout', 'req', makeHeaders());
        expect(isRetryable(err, method)).toBe(true);
      });

      it(`retries 408 APIError on ${method}`, () => {
        const err = new APIError(408, 'REQUEST_TIMEOUT', 'timeout', 'req', makeHeaders());
        expect(isRetryable(err, method)).toBe(true);
      });

      it(`does NOT retry 400 BadRequestError on ${method}`, () => {
        const err = new BadRequestError('BAD', 'invalid', 'req', makeHeaders());
        expect(isRetryable(err, method)).toBe(false);
      });

      it(`does NOT retry 401 AuthenticationError on ${method}`, () => {
        const err = new AuthenticationError('AUTH', 'bad key', 'req', makeHeaders());
        expect(isRetryable(err, method)).toBe(false);
      });

      it(`does NOT retry 404 NotFoundError on ${method}`, () => {
        const err = new NotFoundError('NF', 'not found', 'req', makeHeaders());
        expect(isRetryable(err, method)).toBe(false);
      });
    }
  });

  describe('non-idempotent methods (POST, PATCH)', () => {
    const methods = ['POST', 'PATCH'];

    for (const method of methods) {
      it(`does NOT retry ConnectionError on ${method}`, () => {
        const err = new ConnectionError('network down', null);
        expect(isRetryable(err, method)).toBe(false);
      });

      it(`does NOT retry TimeoutError on ${method}`, () => {
        const err = new TimeoutError(5000);
        expect(isRetryable(err, method)).toBe(false);
      });

      it(`does NOT retry 429 on ${method}`, () => {
        const err = new RateLimitError('RL', 'slow', 'req', makeHeaders(), 60);
        expect(isRetryable(err, method)).toBe(false);
      });

      it(`does NOT retry 500 on ${method}`, () => {
        const err = new InternalServerError('ISE', 'boom', 'req', makeHeaders());
        expect(isRetryable(err, method)).toBe(false);
      });
    }
  });

  it('is case-insensitive for method names', () => {
    const err = new ConnectionError('down', null);
    expect(isRetryable(err, 'get')).toBe(true);
    expect(isRetryable(err, 'Get')).toBe(true);
  });

  it('returns false for unknown error types', () => {
    const err = new Error('random');
    expect(isRetryable(err, 'GET')).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isRetryable('string error', 'GET')).toBe(false);
    expect(isRetryable(42, 'GET')).toBe(false);
    expect(isRetryable(null, 'GET')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeDelay
// ---------------------------------------------------------------------------

describe('computeDelay', () => {
  beforeEach(() => {
    // Fix Math.random to remove jitter for predictable tests.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('computes base delay for attempt 0', () => {
    // With Math.random() = 0.5, jitter = 1 + (0.5 * 0.4 - 0.2) = 1.0
    const delay = computeDelay(0, DEFAULT_CONFIG, new ConnectionError('x', null));
    // base = 500 * 2^0 = 500, jitter = 1.0, result = 500
    expect(delay).toBe(500);
  });

  it('doubles delay for each subsequent attempt', () => {
    // attempt 1: base = 500 * 2^1 = 1000, jitter = 1.0
    const delay = computeDelay(1, DEFAULT_CONFIG, new ConnectionError('x', null));
    expect(delay).toBe(1000);
  });

  it('caps delay at maxDelayMs', () => {
    // attempt 10: base = 500 * 2^10 = 512000, capped at 8000
    const delay = computeDelay(10, DEFAULT_CONFIG, new ConnectionError('x', null));
    expect(delay).toBe(8000);
  });

  it('respects Retry-After from RateLimitError', () => {
    const err = new RateLimitError('RL', 'slow', 'req', makeHeaders(), 30);
    // attempt 0: base delay = 500, Retry-After = 30s = 30000ms
    // Should use max(500, 30000) = 30000
    const delay = computeDelay(0, DEFAULT_CONFIG, err);
    expect(delay).toBe(30000);
  });

  it('uses backoff delay when it exceeds Retry-After', () => {
    const err = new RateLimitError('RL', 'slow', 'req', makeHeaders(), 0);
    // attempt 0: base = 500, Retry-After = 0ms, max(500, 0) = 500
    const delay = computeDelay(0, DEFAULT_CONFIG, err);
    expect(delay).toBe(500);
  });

  it('ignores Retry-After when it is null', () => {
    const err = new RateLimitError('RL', 'slow', 'req', makeHeaders(), null);
    const delay = computeDelay(0, DEFAULT_CONFIG, err);
    expect(delay).toBe(500);
  });

  it('applies jitter when Math.random varies', () => {
    vi.restoreAllMocks();
    // Run multiple times and expect some variation
    const delays = new Set<number>();
    for (let i = 0; i < 20; i++) {
      delays.add(computeDelay(0, DEFAULT_CONFIG, new ConnectionError('x', null)));
    }
    // With true randomness and jitter of +-20%, we should get multiple distinct values
    // (barring astronomically unlikely collisions).
    expect(delays.size).toBeGreaterThan(1);
  });

  it('jitter range is within +-20%', () => {
    vi.restoreAllMocks();
    const config = resolveRetryConfig({ initialDelayMs: 1000, multiplier: 1 });
    // base = 1000 for attempt 0
    // jitter range: 1000 * 0.8 to 1000 * 1.2 → 800 to 1200
    for (let i = 0; i < 50; i++) {
      const delay = computeDelay(0, config, new ConnectionError('x', null));
      expect(delay).toBeGreaterThanOrEqual(800);
      expect(delay).toBeLessThanOrEqual(1200);
    }
  });
});

// ---------------------------------------------------------------------------
// sleep
// ---------------------------------------------------------------------------

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the specified delay', async () => {
    const p = sleep(1000);
    vi.advanceTimersByTime(1000);
    await expect(p).resolves.toBeUndefined();
  });

  it('rejects immediately when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('cancelled'));
    await expect(sleep(1000, controller.signal)).rejects.toThrow('cancelled');
  });

  it('rejects when signal is aborted during the wait', async () => {
    const controller = new AbortController();
    const p = sleep(5000, controller.signal);
    vi.advanceTimersByTime(1000);
    controller.abort(new Error('mid-sleep cancel'));
    await expect(p).rejects.toThrow('mid-sleep cancel');
  });
});

// ---------------------------------------------------------------------------
// withRetry
// ---------------------------------------------------------------------------

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Eliminate jitter for predictable timing
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns result on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, 'GET', DEFAULT_CONFIG);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable errors and eventually succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ConnectionError('fail 1', null))
      .mockResolvedValueOnce('recovered');

    const promise = withRetry(fn, 'GET', DEFAULT_CONFIG);
    // Advance past the first retry delay (500ms with no jitter)
    await vi.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws the last error after exhausting all retries', async () => {
    // Use real timers with tiny delays to avoid unhandled rejection timing issues
    vi.useRealTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const error = new ConnectionError('persistent failure', null);
    const fn = vi.fn().mockRejectedValue(error);
    const config = resolveRetryConfig({ maxRetries: 2, initialDelayMs: 1, maxDelayMs: 5 });

    await expect(withRetry(fn, 'GET', config)).rejects.toThrow('persistent failure');
    // 1 initial + 2 retries = 3 total
    expect(fn).toHaveBeenCalledTimes(3);

    // Restore fake timers for subsequent tests
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('does NOT retry non-retryable errors (400)', async () => {
    const error = new BadRequestError('BAD', 'invalid input', 'req', makeHeaders());
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn, 'GET', DEFAULT_CONFIG)).rejects.toThrow('invalid input');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry non-retryable errors (401)', async () => {
    const error = new AuthenticationError('AUTH', 'bad key', 'req', makeHeaders());
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn, 'GET', DEFAULT_CONFIG)).rejects.toThrow('bad key');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry non-retryable errors (404)', async () => {
    const error = new NotFoundError('NF', 'not found', 'req', makeHeaders());
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn, 'GET', DEFAULT_CONFIG)).rejects.toThrow('not found');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry any error on POST method', async () => {
    const error = new ConnectionError('network', null);
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn, 'POST', DEFAULT_CONFIG)).rejects.toThrow('network');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry when maxRetries is 0', async () => {
    const error = new ConnectionError('fail', null);
    const fn = vi.fn().mockRejectedValue(error);
    const config = resolveRetryConfig({ maxRetries: 0 });

    await expect(withRetry(fn, 'GET', config)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respects Retry-After header delay for 429 errors', async () => {
    const rateLimitErr = new RateLimitError('RL', 'slow down', 'req', makeHeaders(), 5);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(rateLimitErr)
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, 'GET', DEFAULT_CONFIG);
    // Retry-After is 5 seconds = 5000ms, which is greater than the base 500ms delay
    // So the delay should be 5000ms
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('aborts pending retries when AbortSignal fires', async () => {
    const controller = new AbortController();
    const error = new ConnectionError('fail', null);
    const fn = vi.fn().mockRejectedValue(error);

    const promise = withRetry(fn, 'GET', DEFAULT_CONFIG, controller.signal);

    // Wait a bit then abort during the retry sleep
    await vi.advanceTimersByTimeAsync(100);
    controller.abort(new Error('user cancelled'));

    await expect(promise).rejects.toThrow('user cancelled');
  });

  it('retries TimeoutError on idempotent methods', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TimeoutError(5000))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, 'GET', DEFAULT_CONFIG);
    await vi.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

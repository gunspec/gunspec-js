import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../../../src/core/http-client';
import { PermissionError, RateLimitError, createAPIError } from '../../../src/core/errors';
import { ERROR_REASONS } from '../../../src/types/error-reasons';

/**
 * What a script is told when the day's allowance is spent.
 *
 * A daily refusal carries the real time left until the reset (never a fixed
 * hour), the limit that was reached and the reset instant, in the body and the
 * headers, and the plan's month says the same. These hold that the error hands
 * them over as plain values, that the SDK retries one of these refusals only when
 * the reset is within `maxRetryAfterMs` (a call refused a second before midnight
 * waits the second and succeeds) and never sleeps through a longer wait, and that
 * a per-minute refusal and a paused key are unchanged.
 */
const headers = (init: Record<string, string> = {}) => new Headers(init);

const dailyBody = {
  success: false as const,
  error: {
    code: 'DAILY_CAP_EXCEEDED',
    reason: 'DAILY_CAP_EXCEEDED',
    message: 'Daily request limit (50) exceeded for your tier (explorer). Resets at 2026-10-03T00:00:00.000Z (midnight UTC).',
    limit: 50,
    resetsAt: '2026-10-03T00:00:00.000Z',
    retryAfter: 14400,
  },
};

describe('RateLimitError on a daily refusal', () => {
  it('says the limit and the reset as plain values, from the body', () => {
    const err = createAPIError(429, dailyBody, 'req-1', headers({ 'Retry-After': '14400' })) as RateLimitError;
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.isDailyCap).toBe(true);
    expect(err.dailyLimit).toBe(50);
    expect(err.dailyReset).toBeInstanceOf(Date);
    expect(err.dailyReset?.toISOString()).toBe('2026-10-03T00:00:00.000Z');
    expect(err.retryAfter).toBe(14400);
  });

  it('falls back to the headers when the body does not carry them', () => {
    const body = { success: false as const, error: { code: 'DAILY_CAP_EXCEEDED', reason: 'DAILY_CAP_EXCEEDED', message: 'x' } };
    const err = createAPIError(
      429,
      body,
      '',
      headers({ 'Retry-After': '600', 'X-Daily-Limit': '50', 'X-Daily-Remaining': '0', 'X-Daily-Reset': '2026-10-03T00:00:00.000Z' }),
    ) as RateLimitError;
    expect(err.dailyLimit).toBe(50);
    expect(err.dailyReset?.toISOString()).toBe('2026-10-03T00:00:00.000Z');
  });

  it('is null, never an Invalid Date or NaN, when neither says', () => {
    const body = { success: false as const, error: { code: 'DAILY_CAP_EXCEEDED', reason: 'DAILY_CAP_EXCEEDED', message: 'x' } };
    const bare = createAPIError(429, body, '', headers({ 'Retry-After': '3600' })) as RateLimitError;
    expect(bare.dailyLimit).toBeNull();
    expect(bare.dailyReset).toBeNull();

    const junk = createAPIError(
      429,
      { ...body, error: { ...body.error, limit: 'lots', resetsAt: 'tomorrow' } },
      '',
      headers({ 'X-Daily-Limit': 'many', 'X-Daily-Reset': 'soon' }),
    ) as RateLimitError;
    expect(junk.dailyLimit).toBeNull();
    expect(junk.dailyReset).toBeNull();
  });

  it('prefers a body that parses over a header, and uses the header when the body does not parse', () => {
    const err = createAPIError(
      429,
      { ...dailyBody, error: { ...dailyBody.error, resetsAt: 'not a date' } },
      '',
      headers({ 'X-Daily-Reset': '2026-10-03T00:00:00.000Z' }),
    ) as RateLimitError;
    expect(err.dailyReset?.toISOString()).toBe('2026-10-03T00:00:00.000Z');
  });

  it('keeps the same facts in details and the log line, with nothing sensitive', () => {
    const err = createAPIError(429, dailyBody, 'req-1', headers({ 'Retry-After': '14400' })) as RateLimitError;
    expect(err.details).toMatchObject({ limit: 50, resetsAt: '2026-10-03T00:00:00.000Z' });
    expect(JSON.stringify(err.toJSON())).not.toContain('gsk_');
  });
});

describe('RateLimitError on the MCP share of the day', () => {
  const mcp = {
    success: false as const,
    error: { code: 'MCP_DAILY_CAP_EXCEEDED', reason: 'MCP_DAILY_CAP_EXCEEDED', message: 'x', limit: 20, resetsAt: '2026-10-03T00:00:00.000Z', retryAfter: 600 },
  };

  it('is a daily cap too: no short wait helps unless the reset is close', () => {
    const err = createAPIError(429, mcp, '', headers({ 'Retry-After': '600' })) as RateLimitError;
    expect(err.isDailyCap).toBe(true);
    expect(err.dailyLimit).toBe(20);
    expect(err.dailyReset?.toISOString()).toBe('2026-10-03T00:00:00.000Z');
  });

  it('reads the MCP headers, not the plan ones, when the body is silent', () => {
    const body = { success: false as const, error: { code: 'MCP_DAILY_CAP_EXCEEDED', reason: 'MCP_DAILY_CAP_EXCEEDED', message: 'x' } };
    const err = createAPIError(
      429,
      body,
      '',
      headers({ 'X-Daily-Limit': '50', 'X-Daily-Reset': '2026-10-03T00:00:00.000Z', 'X-Daily-MCP-Limit': '20', 'X-Daily-MCP-Reset': '2026-10-03T00:00:00.000Z' }),
    ) as RateLimitError;
    expect(err.dailyLimit).toBe(20);
  });
});

describe('RateLimitError on a per-minute refusal', () => {
  it('is not a daily cap and reports no daily facts, even if daily headers ride along', () => {
    const err = createAPIError(
      429,
      { success: false, error: { code: 'RATE_LIMITED', reason: 'RATE_LIMITED', message: 'slow down' } },
      '',
      headers({ 'Retry-After': '60', 'X-Daily-Limit': '50', 'X-Daily-Reset': '2026-10-03T00:00:00.000Z' }),
    ) as RateLimitError;
    expect(err.isDailyCap).toBe(false);
    expect(err.dailyLimit).toBeNull();
    expect(err.dailyReset).toBeNull();
    expect(err.retryAfter).toBe(60);
  });

  it('keeps the positional constructor for existing callers', () => {
    const err = new RateLimitError('RATE_LIMITED', 'slow', 'r', headers(), 7);
    expect(err.dailyLimit).toBeNull();
    expect(err.dailyReset).toBeNull();
  });
});

describe('what the client does with a 429', () => {
  const fetchMock = vi.fn();
  const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'req-1', ...extra } });
  const make = (retry: ConstructorParameters<typeof HttpClient>[0]['retry']) =>
    new HttpClient({ auth: { apiKey: 'gsk_test' }, retry, fetch: fetchMock });

  beforeEach(() => fetchMock.mockReset());
  afterEach(() => vi.useRealTimers());

  it('surfaces a daily refusal at once, however long the wait, with the reset in hand', async () => {
    vi.useFakeTimers();
    const client = make({ maxRetries: 3, initialDelayMs: 1 });
    /* Fourteen hours to the reset: far past the default `maxRetryAfterMs` of 30 seconds. */
    fetchMock.mockResolvedValue(json(dailyBody, 429, { 'Retry-After': '50400', 'X-Daily-Reset': '2026-10-03T00:00:00.000Z' }));

    const outcome = client.get('/v1/firearms').then(
      () => null,
      (e: unknown) => e,
    );
    /* No timer is waited on: the rejection arrives without advancing the clock. */
    const error = (await outcome) as RateLimitError;
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.isDailyCap).toBe(true);
    expect(error.retryAfter).toBe(50400);
    expect(error.dailyReset?.toISOString()).toBe('2026-10-03T00:00:00.000Z');
    expect(error.dailyLimit).toBe(50);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retries a daily refusal whose reset is a couple of seconds away, so a call refused before midnight succeeds after it', async () => {
    vi.useFakeTimers();
    const client = make({ maxRetries: 2, initialDelayMs: 1 });
    fetchMock
      .mockResolvedValueOnce(json(dailyBody, 429, { 'Retry-After': '2' }))
      .mockResolvedValueOnce(json({ success: true, data: 'ok' }, 200));

    const pending = client.get<string>('/v1/firearms');
    await vi.advanceTimersByTimeAsync(1_500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1_000);
    expect((await pending).data).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries the MCP share of the day on the same rule', async () => {
    vi.useFakeTimers();
    const client = make({ maxRetries: 2, initialDelayMs: 1 });
    const mcpBody = { success: false, error: { code: 'MCP_DAILY_CAP_EXCEEDED', reason: 'MCP_DAILY_CAP_EXCEEDED', message: 'x' } };
    fetchMock.mockResolvedValueOnce(json(mcpBody, 429, { 'Retry-After': '2' })).mockResolvedValueOnce(json({ success: true, data: 'ok' }, 200));

    const pending = client.get<string>('/v1/firearms');
    await vi.advanceTimersByTimeAsync(2_500);
    expect((await pending).data).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a daily refusal that asks for more than the caller allows, and sleeps on nothing', async () => {
    vi.useFakeTimers();
    const client = make({ maxRetries: 3, initialDelayMs: 1, maxRetryAfterMs: 5_000 });
    fetchMock.mockResolvedValue(json(dailyBody, 429, { 'Retry-After': '6' }));
    const error = (await client.get('/v1/firearms').then(() => null, (e: unknown) => e)) as RateLimitError;
    expect(error.isDailyCap).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not retry a daily refusal that sends no Retry-After: nothing says the reset is close, and a refused call is still counted', async () => {
    const client = make({ maxRetries: 3, initialDelayMs: 1 });
    fetchMock.mockResolvedValue(json(dailyBody, 429));
    await expect(client.get('/v1/firearms')).rejects.toBeInstanceOf(RateLimitError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxRetries when the refusal repeats, and never waits longer than allowed between attempts', async () => {
    vi.useFakeTimers();
    const client = make({ maxRetries: 2, initialDelayMs: 1, maxRetryAfterMs: 30_000 });
    /* A new Response each call: a body can be read once, and every attempt reads it. */
    fetchMock.mockImplementation(async () => json(dailyBody, 429, { 'Retry-After': '2' }));

    const outcome = client.get('/v1/firearms').then(() => null, (e: unknown) => e);
    await vi.advanceTimersByTimeAsync(10_000);
    const error = (await outcome) as RateLimitError;
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.isDailyCap).toBe(true);
    /* The first call and two retries, each after the two seconds the server asked for. */
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('still waits out a per-minute refusal when the wait is one the caller allows', async () => {
    vi.useFakeTimers();
    const client = make({ maxRetries: 1, initialDelayMs: 1, maxRetryAfterMs: 120_000 });
    fetchMock
      .mockResolvedValueOnce(json({ success: false, error: { code: 'RATE_LIMITED', reason: 'RATE_LIMITED', message: 'slow' } }, 429, { 'Retry-After': '60' }))
      .mockResolvedValueOnce(json({ success: true, data: 'ok' }, 200));

    const pending = client.get<string>('/v1/firearms');
    await vi.advanceTimersByTimeAsync(59_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2_000);
    expect((await pending).data).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces a per-minute refusal whose wait exceeds what the caller allows, as before', async () => {
    const client = make({ maxRetries: 3, initialDelayMs: 1 });
    fetchMock.mockResolvedValue(json({ success: false, error: { code: 'RATE_LIMITED', reason: 'RATE_LIMITED', message: 'slow' } }, 429, { 'Retry-After': '60' }));
    await expect(client.get('/v1/firearms')).rejects.toMatchObject({ retryAfter: 60, isDailyCap: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('RateLimitError on the plan\'s month', () => {
  const monthlyBody = {
    success: false as const,
    error: {
      code: 'MONTHLY_CAP_EXCEEDED',
      reason: 'MONTHLY_CAP_EXCEEDED',
      message: 'Monthly request limit (200) reached for your plan (explorer). Resets at 2026-11-01T00:00:00.000Z (midnight UTC on the 1st).',
      limit: 200,
      resetsAt: '2026-11-01T00:00:00.000Z',
      retryAfter: 2_592_000,
    },
  };

  it('says the limit and the reset as plain values, from the body, and is not a daily cap', () => {
    const err = createAPIError(429, monthlyBody, 'req-1', headers({ 'Retry-After': '2592000' })) as RateLimitError;
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.isMonthlyCap).toBe(true);
    expect(err.isDailyCap).toBe(false);
    expect(err.monthlyLimit).toBe(200);
    expect(err.monthlyReset?.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(err.retryAfter).toBe(2_592_000);
    expect(err.dailyLimit).toBeNull();
    expect(err.dailyReset).toBeNull();
  });

  it('falls back to the monthly headers, never the daily ones', () => {
    const body = { success: false as const, error: { code: 'MONTHLY_CAP_EXCEEDED', reason: 'MONTHLY_CAP_EXCEEDED', message: 'x' } };
    const err = createAPIError(
      429,
      body,
      '',
      headers({
        'X-Daily-Limit': '50',
        'X-Daily-Reset': '2026-10-03T00:00:00.000Z',
        'X-Monthly-Limit': '200',
        'X-Monthly-Remaining': '0',
        'X-Monthly-Reset': '2026-11-01T00:00:00.000Z',
      }),
    ) as RateLimitError;
    expect(err.monthlyLimit).toBe(200);
    expect(err.monthlyReset?.toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });

  it('is null, never an Invalid Date or NaN, when neither says', () => {
    const body = { success: false as const, error: { code: 'MONTHLY_CAP_EXCEEDED', reason: 'MONTHLY_CAP_EXCEEDED', message: 'x' } };
    const bare = createAPIError(429, body, '', headers({ 'Retry-After': '3600' })) as RateLimitError;
    expect(bare.monthlyLimit).toBeNull();
    expect(bare.monthlyReset).toBeNull();
    const junk = createAPIError(
      429,
      { ...body, error: { ...body.error, limit: 'lots', resetsAt: 'next month' } },
      '',
      headers({ 'X-Monthly-Limit': 'many', 'X-Monthly-Reset': 'soon' }),
    ) as RateLimitError;
    expect(junk.monthlyLimit).toBeNull();
    expect(junk.monthlyReset).toBeNull();
  });

  it('reports no monthly facts on any other 429, even with monthly headers riding along', () => {
    const err = createAPIError(
      429,
      { success: false, error: { code: 'RATE_LIMITED', reason: 'RATE_LIMITED', message: 'slow down' } },
      '',
      headers({ 'Retry-After': '60', 'X-Monthly-Limit': '200', 'X-Monthly-Reset': '2026-11-01T00:00:00.000Z' }),
    ) as RateLimitError;
    expect(err.isMonthlyCap).toBe(false);
    expect(err.monthlyLimit).toBeNull();
    expect(err.monthlyReset).toBeNull();
  });
});

describe('what the client does with a monthly refusal', () => {
  const fetchMock = vi.fn();
  const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'req-1', ...extra } });
  const make = (retry: ConstructorParameters<typeof HttpClient>[0]['retry']) =>
    new HttpClient({ auth: { apiKey: 'gsk_test' }, retry, fetch: fetchMock });
  const monthly = { success: false, error: { code: 'MONTHLY_CAP_EXCEEDED', reason: 'MONTHLY_CAP_EXCEEDED', message: 'x', limit: 200, resetsAt: '2026-11-01T00:00:00.000Z' } };

  beforeEach(() => fetchMock.mockReset());
  afterEach(() => vi.useRealTimers());

  it('surfaces it at once when the reset is weeks away, with the reset in hand and no sleeping', async () => {
    vi.useFakeTimers();
    const client = make({ maxRetries: 3, initialDelayMs: 1 });
    fetchMock.mockResolvedValue(json(monthly, 429, { 'Retry-After': '2000000' }));
    const error = (await client.get('/v1/firearms').then(() => null, (e: unknown) => e)) as RateLimitError;
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.isMonthlyCap).toBe(true);
    expect(error.retryAfter).toBe(2_000_000);
    expect(error.monthlyReset?.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retries it when the month ends in a few seconds', async () => {
    vi.useFakeTimers();
    const client = make({ maxRetries: 2, initialDelayMs: 1 });
    fetchMock.mockResolvedValueOnce(json(monthly, 429, { 'Retry-After': '3' })).mockResolvedValueOnce(json({ success: true, data: 'ok' }, 200));
    const pending = client.get<string>('/v1/firearms');
    await vi.advanceTimersByTimeAsync(3_500);
    expect((await pending).data).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry one that sends no Retry-After', async () => {
    const client = make({ maxRetries: 3, initialDelayMs: 1 });
    fetchMock.mockResolvedValue(json(monthly, 429));
    await expect(client.get('/v1/firearms')).rejects.toBeInstanceOf(RateLimitError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('a paused key', () => {
  const body = { success: false as const, error: { code: 'FORBIDDEN', reason: 'KEY_ON_HOLD', message: 'This key is paused until 2026-10-03T00:00:00.000Z' } };

  it('is a permission error with the seconds until the pause ends, never a retry', async () => {
    const err = createAPIError(403, body, 'req-1', headers({ 'Retry-After': '5400' }));
    expect(err).toBeInstanceOf(PermissionError);
    expect(err.reason).toBe('KEY_ON_HOLD');
    expect(err.retryAfter).toBe(5400);
    expect(err.action).toBe(ERROR_REASONS.KEY_ON_HOLD.action);
    expect(err.action).toContain('Retry-After');
  });

  it('is not retried by the client: a pause is not transient', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), { status: 403, headers: { 'Content-Type': 'application/json', 'Retry-After': '1' } }),
    );
    const client = new HttpClient({ auth: { apiKey: 'gsk_test' }, retry: { maxRetries: 3, initialDelayMs: 1 }, fetch: fetchMock });
    await expect(client.get('/v1/firearms')).rejects.toBeInstanceOf(PermissionError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

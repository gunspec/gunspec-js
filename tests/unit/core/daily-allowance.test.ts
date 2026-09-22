import { describe, expect, it } from 'vitest';
import { parseRateLimitHeaders } from '../../../src/core/response';

/**
 * What the response says about your allowance.
 *
 * The per-minute three were parsed and shipped for years against an API that
 * sends none of them, so every reader got `null` and no test noticed - the
 * suite mocked the headers it wanted. These hold the daily figures, which are
 * real, and hold the phantoms at null when the API behaves as it actually does.
 */
const headers = (init: Record<string, string>) => new Headers(init);

describe('parseRateLimitHeaders', () => {
  it('reads the daily allowance the API really sends', () => {
    const info = parseRateLimitHeaders(
      headers({
        'X-Daily-Limit': '2000',
        'X-Daily-Remaining': '1847',
        'X-Daily-Reset': '2026-09-20T00:00:00.000Z',
      }),
    );
    expect(info.dailyLimit).toBe(2000);
    expect(info.dailyRemaining).toBe(1847);
    expect(info.dailyReset?.toISOString()).toBe('2026-09-20T00:00:00.000Z');
  });

  it('leaves the per-minute fields null, which is what this API sends', () => {
    const info = parseRateLimitHeaders(headers({ 'X-Daily-Limit': '50', 'X-Daily-Remaining': '49' }));
    expect(info.limit).toBeNull();
    expect(info.remaining).toBeNull();
    expect(info.reset).toBeNull();
  });

  it('nulls a daily allowance a plan without a ceiling does not send', () => {
    const info = parseRateLimitHeaders(headers({}));
    expect(info.dailyLimit).toBeNull();
    expect(info.dailyRemaining).toBeNull();
    expect(info.dailyReset).toBeNull();
  });

  it('nulls an unparseable reset rather than handing back an Invalid Date', () => {
    const info = parseRateLimitHeaders(headers({ 'X-Daily-Reset': 'tomorrow' }));
    expect(info.dailyReset).toBeNull();
  });
});

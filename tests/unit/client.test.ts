import { describe, it, expect, vi } from 'vitest';
import { GunSpec } from '../../src/client';
import { FIXTURE_KEY, FIXTURE_KEY_HINT, FIXTURE_KEY_OTHER } from '../helpers/keys';

const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, data: { ok: true } }), {
  status: 200, headers: { 'Content-Type': 'application/json' },
}));

const make = (overrides = {}) => new GunSpec({ apiKey: FIXTURE_KEY, fetch: fetchMock as unknown as typeof fetch, retry: { maxRetries: 0 }, ...overrides });

describe('GunSpec client', () => {
  it('exposes one resource per API tag', () => {
    const client = make();
    for (const name of ['firearms', 'manufacturers', 'calibers', 'categories', 'ammunition', 'attachments', 'interfaces',
      'platforms', 'vendor', 'stats', 'game', 'gameStats', 'countries', 'conflicts', 'content', 'collections',
      'dataQuality', 'favorites', 'reports', 'support', 'webhooks', 'usage'] as const) {
      expect(client[name], name).toBeDefined();
    }
  });

  it('sends SDK telemetry headers and the key on every request', async () => {
    await make().stats.summary();
    const init = fetchMock.mock.calls.at(-1)![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['User-Agent']).toMatch(/^gunspec-sdk\/typescript\/\d+\.\d+\.\d+$/);
    expect(headers['X-SDK-Language']).toBe('typescript');
    expect(headers['X-API-Key']).toBe('gsk_72ee457ac9ccc5b2b5bc788f5269feca');
  });

  it('withOptions derives a client without mutating the original', async () => {
    const base = make();
    const derived = base.withOptions({ apiKey: FIXTURE_KEY_OTHER, authScheme: 'bearer' });
    await derived.stats.summary();
    let headers = (fetchMock.mock.calls.at(-1)![1] as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${FIXTURE_KEY_OTHER}`);
    await base.stats.summary();
    headers = (fetchMock.mock.calls.at(-1)![1] as RequestInit).headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe('gsk_72ee457ac9ccc5b2b5bc788f5269feca');
    expect(headers['Authorization']).toBeUndefined();
  });

  it('never prints the key', () => {
    const printed = JSON.stringify(make());
    expect(printed).not.toContain('gsk_72ee457ac9ccc5b2b5bc788f5269feca');
    expect(printed).toContain(`"apiKey":"${FIXTURE_KEY_HINT}"`);
    expect(printed).toContain('"version"');
    expect(make().isAuthenticated).toBe(true);
    expect(make({ apiKey: null }).isAuthenticated).toBe(false);
  });
});

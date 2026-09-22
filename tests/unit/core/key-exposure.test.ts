import { describe, it, expect, vi } from 'vitest';
import { inspect } from 'node:util';
import { GunSpec } from '../../../src/client';
import { HttpClient } from '../../../src/core/http-client';
import { FIXTURE_KEY, FIXTURE_KEY_HINT, FIXTURE_KEY_OTHER } from '../../helpers/keys';

/*
 * `toJSON` always masked the key, but `console.log(client)` goes through
 * `util.inspect`, which printed the plain `_options.apiKey` and
 * `_client.apiKey` properties in full.
 */

const fetchMock = vi.fn();

describe('the key stays out of inspectable state', () => {
  const client = new GunSpec({ apiKey: FIXTURE_KEY, fetch: fetchMock });

  it('util.inspect of the client shows only the masked key', () => {
    const printed = inspect(client, { depth: Infinity, showHidden: true });
    expect(printed).not.toContain(FIXTURE_KEY);
    expect(printed).toContain(FIXTURE_KEY_HINT);
  });

  it('util.inspect of the transport and of a resource never shows the key', () => {
    expect(inspect(client.http, { depth: Infinity, showHidden: true })).not.toContain(FIXTURE_KEY);
    expect(inspect(client.firearms, { depth: Infinity, showHidden: true })).not.toContain(FIXTURE_KEY);
    const bare = new HttpClient({ auth: { apiKey: FIXTURE_KEY }, fetch: fetchMock });
    expect(inspect(bare, { depth: Infinity, showHidden: true })).not.toContain(FIXTURE_KEY);
  });

  it('no enumerable property holds the key', () => {
    const walk = (value: unknown, seen = new Set<unknown>()): string[] => {
      if (typeof value === 'string') return [value];
      if (typeof value !== 'object' || value === null || seen.has(value)) return [];
      seen.add(value);
      return Object.values(value).flatMap((v) => walk(v, seen));
    };
    expect(walk(client)).not.toContain(FIXTURE_KEY);
  });

  it('withOptions still carries the key over, and an override still replaces it', async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ success: true, data: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    await client.withOptions({ timeout: 5_000 }).stats.summary();
    expect((fetchMock.mock.calls.at(-1)![1] as { headers: Record<string, string> }).headers['X-API-Key']).toBe(FIXTURE_KEY);
    await client.withOptions({ apiKey: FIXTURE_KEY_OTHER }).stats.summary();
    expect((fetchMock.mock.calls.at(-1)![1] as { headers: Record<string, string> }).headers['X-API-Key']).toBe(FIXTURE_KEY_OTHER);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GunSpec } from '../../../src/client';
import { InvalidArgumentError } from '../../../src/core/errors';
import { pathSegment } from '../../../src/core/path';

/*
 * `encodeURIComponent` leaves dots alone and URL parsing collapses a `.` or
 * `..` segment, so `webhooks.test('..')` used to POST to `/v1/me/test`. Every
 * resource now builds its ids through `pathSegment`, which refuses them.
 */

const fetchMock = vi.fn();
const client = new GunSpec({ apiKey: null, fetch: fetchMock, retry: { maxRetries: 0 } });

/** A sync throw and an async rejection both surface as a rejection here. */
const attempt = (fn: () => unknown) => Promise.resolve().then(fn);

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ success: true, data: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }));
});

describe('pathSegment', () => {
  it.each(['', '.', '..'])('refuses %j', (value) => {
    expect(() => pathSegment(value)).toThrow(InvalidArgumentError);
  });

  it('encodes everything else, dots inside an id included', () => {
    expect(pathSegment('glock-g17')).toBe('glock-g17');
    expect(pathSegment('picatinny:mil-std/1913')).toBe('picatinny%3Amil-std%2F1913');
    expect(pathSegment('...')).toBe('...');
    expect(pathSegment('5.56x45mm')).toBe('5.56x45mm');
    expect(pathSegment(0)).toBe('0');
  });
});

describe('resource methods refuse a dot segment before any request', () => {
  const cases: Array<[string, (id: string) => unknown]> = [
    ['webhooks.test', (id) => client.webhooks.test(id)],
    ['webhooks.delete', (id) => client.webhooks.delete(id)],
    ['firearms.get', (id) => client.firearms.get(id)],
    ['firearms.getSchematics', (id) => client.firearms.getSchematics(id)],
    ['firearms.downloadMedia (selector)', (id) => client.firearms.downloadMedia('glock-g17', id)],
    ['firearms.getImageAsset (image id)', (id) => client.firearms.getImageAsset('glock-g17', id)],
    ['calibers.get', (id) => client.calibers.get(id)],
    ['manufacturers.get', (id) => client.manufacturers.get(id)],
    ['favorites.remove', (id) => client.favorites.remove(id)],
    ['support.get', (id) => client.support.get(id)],
    ['vendor.clickUrl', (id) => client.vendor.clickUrl(id)],
    ['gameStats.getFirearm (version)', (id) => client.gameStats.getFirearm(id, 'glock-g17')],
  ];

  for (const [name, call] of cases) {
    it.each(['', '.', '..'])(`${name} refuses %j`, async (value) => {
      await expect(attempt(() => call(value))).rejects.toBeInstanceOf(InvalidArgumentError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  }

  it('still reaches the right path for a normal id', async () => {
    await client.webhooks.test('wh_1');
    expect(fetchMock.mock.calls[0]![0]).toBe('https://api.gunspec.io/v1/me/webhooks/wh_1/test');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '../../../src/core/http-client';
import { MemoryETagStore } from '../../../src/core/etag-cache';
import { ConfigurationError, GunSpecError, RateLimitError, ServiceUnavailableError } from '../../../src/core/errors';
import { FIXTURE_KEY, FIXTURE_KEY_HINT } from '../../helpers/keys';

const fetchMock = vi.fn();

function json(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(init.status === 304 ? null : JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'req-1', ...init.headers },
  });
}

function make(config: ConstructorParameters<typeof HttpClient>[0] = {}) {
  return new HttpClient({ auth: { apiKey: 'gsk_test' }, retry: { maxRetries: 0 }, fetch: fetchMock, ...config });
}

const lastInit = () => fetchMock.mock.calls.at(-1)![1] as { headers: Record<string, string>; redirect?: string };

beforeEach(() => fetchMock.mockReset());

describe('ETag cache', () => {
  it('stores the body on a 200 with an ETag and sends If-None-Match next time', async () => {
    const client = make({ etagCache: true });
    fetchMock.mockResolvedValueOnce(json({ success: true, data: { v: 1 } }, { headers: { ETag: '"abc"' } }));
    const first = await client.get<{ v: number }>('/v1/firearms/ak-47');
    expect(first.etag).toBe('"abc"');
    expect(first.fromCache).toBe(false);
    expect(lastInit().headers['If-None-Match']).toBeUndefined();

    fetchMock.mockResolvedValueOnce(json(null, { status: 304, headers: { ETag: '"abc"' } }));
    const second = await client.get<{ v: number }>('/v1/firearms/ak-47');
    expect(lastInit().headers['If-None-Match']).toBe('"abc"');
    expect(second.status).toBe(304);
    expect(second.fromCache).toBe(true);
    expect(second.data).toEqual({ v: 1 });
  });

  it('replaces the held body when the API answers 200 with a new tag', async () => {
    const store = new MemoryETagStore();
    const client = make({ etagCache: store });
    fetchMock.mockResolvedValueOnce(json({ success: true, data: 1 }, { headers: { ETag: '"1"' } }));
    await client.get('/v1/x');
    fetchMock.mockResolvedValueOnce(json({ success: true, data: 2 }, { headers: { ETag: '"2"' } }));
    const res = await client.get<number>('/v1/x');
    expect(res.data).toBe(2);
    expect(res.fromCache).toBe(false);
    expect(store.size).toBe(1);
  });

  it('does not cache responses without an ETag, or non-GET requests', async () => {
    const store = new MemoryETagStore();
    const client = make({ etagCache: store });
    fetchMock.mockResolvedValueOnce(json({ success: true, data: 1 }));
    await client.get('/v1/x');
    fetchMock.mockResolvedValueOnce(json({ success: true, data: 1 }, { headers: { ETag: '"p"' } }));
    await client.post('/v1/x', {});
    expect(store.size).toBe(0);
  });

  it('keeps two keys apart in a shared store', async () => {
    const store = new MemoryETagStore();
    const a = make({ etagCache: store, auth: { apiKey: 'gsk_a' } });
    const b = make({ etagCache: store, auth: { apiKey: 'gsk_b' } });
    fetchMock.mockResolvedValueOnce(json({ success: true, data: 'paid' }, { headers: { ETag: '"t"' } }));
    await a.get('/v1/x');
    fetchMock.mockResolvedValueOnce(json({ success: true, data: 'free' }, { headers: { ETag: '"t"' } }));
    await b.get('/v1/x');
    expect(lastInit().headers['If-None-Match']).toBeUndefined();
    expect(store.size).toBe(2);
  });

  it('works for paginated responses and keeps meta', async () => {
    const client = make({ etagCache: true });
    const page = { success: true, data: [1], pagination: { page: 1, limit: 20, per_page: 20 }, meta: { fingerprint: 'f' } };
    fetchMock.mockResolvedValueOnce(json(page, { headers: { ETag: '"p"' } }));
    const first = await client.getPaginated<number>('/v1/list');
    expect(first.meta).toEqual({ fingerprint: 'f' });
    fetchMock.mockResolvedValueOnce(json(null, { status: 304, headers: { ETag: '"p"' } }));
    const second = await client.getPaginated<number>('/v1/list');
    expect(second.fromCache).toBe(true);
    expect(second.data).toEqual([1]);
    expect(second.pagination.per_page).toBe(20);
  });
});

describe('requestConditional', () => {
  it('surfaces a 304 to a caller holding their own tag', async () => {
    const client = make();
    fetchMock.mockResolvedValueOnce(json(null, { status: 304, headers: { ETag: '"z"', 'Cache-Control': 'public, max-age=300' } }));
    const res = await client.requestConditional({ method: 'GET', path: '/v1/x', ifNoneMatch: '"z"' });
    expect(lastInit().headers['If-None-Match']).toBe('"z"');
    expect(res.notModified).toBe(true);
    expect(res.etag).toBe('"z"');
    expect(res.cacheControl).toBe('public, max-age=300');
  });

  it('returns the body when the tag no longer matches', async () => {
    const client = make();
    fetchMock.mockResolvedValueOnce(json({ success: true, data: 'new' }, { headers: { ETag: '"y"' } }));
    const res = await client.requestConditional<string>({ method: 'GET', path: '/v1/x', ifNoneMatch: '"z"' });
    expect(res.notModified).toBe(false);
    if (!res.notModified) expect(res.data).toBe('new');
  });
});

describe('raw responses', () => {
  it('getText reads an SVG without touching the envelope parser', async () => {
    const client = make();
    fetchMock.mockResolvedValueOnce(new Response('<svg/>', { status: 200, headers: { 'Content-Type': 'image/svg+xml' } }));
    expect(await client.getText('/v1/ammunition/x/bullet.svg')).toBe('<svg/>');
    expect(lastInit().headers['Accept']).toBe('*/*');
  });

  it('getBytes returns bytes, content type and final URL', async () => {
    const client = make();
    fetchMock.mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'Content-Type': 'model/gltf-binary' } }));
    const raw = await client.getBytes('/v1/firearms/x/model');
    expect(Array.from(raw.body)).toEqual([1, 2, 3]);
    expect(raw.contentType).toBe('model/gltf-binary');
  });

  it('names the right method when a binary body is read as JSON', async () => {
    const client = make();
    fetchMock.mockResolvedValueOnce(new Response('<svg/>', { status: 200, headers: { 'Content-Type': 'image/svg+xml' } }));
    await expect(client.get('/v1/x')).rejects.toThrow(GunSpecError);
    fetchMock.mockResolvedValueOnce(new Response('<svg/>', { status: 200, headers: { 'Content-Type': 'image/svg+xml' } }));
    await expect(client.get('/v1/x')).rejects.toThrow(/getText\(\) or getBytes\(\)/);
  });

  it('resolveRedirect returns Location without following', async () => {
    const client = make();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: 'https://shop.example/x' } }));
    expect(await client.resolveRedirect('/v1/out/abc')).toBe('https://shop.example/x');
    expect(lastInit().redirect).toBe('manual');
  });
});

describe('auth scheme', () => {
  it('sends X-API-Key by default and Bearer on request', async () => {
    fetchMock.mockImplementation(async () => json({ success: true, data: null }));
    await make().get('/v1/x');
    expect(lastInit().headers['X-API-Key']).toBe('gsk_test');
    expect(lastInit().headers['Authorization']).toBeUndefined();

    await make({ auth: { apiKey: 'gsk_test', scheme: 'bearer' } }).get('/v1/x');
    expect(lastInit().headers['Authorization']).toBe('Bearer gsk_test');
    expect(lastInit().headers['X-API-Key']).toBeUndefined();
  });

  it('reports isAuthenticated without exposing the key', () => {
    expect(make().isAuthenticated).toBe(true);
    const printed = JSON.stringify(make({ auth: { apiKey: FIXTURE_KEY } }));
    expect(printed).not.toContain(FIXTURE_KEY);
    expect(printed).toContain(FIXTURE_KEY_HINT);
  });
});

describe('transport security', () => {
  it('refuses a key over plain http to a remote host', () => {
    expect(() => make({ baseUrl: 'http://api.example.com' })).toThrow(ConfigurationError);
  });

  it('allows localhost, an explicit override, and keyless http', () => {
    expect(() => make({ baseUrl: 'http://localhost:8787' })).not.toThrow();
    expect(() => make({ baseUrl: 'http://127.0.0.1:8787' })).not.toThrow();
    expect(() => make({ baseUrl: 'http://api.example.com', allowInsecure: true })).not.toThrow();
    const originalEnv = process.env.GUNSPEC_API_KEY;
    delete process.env.GUNSPEC_API_KEY;
    try {
      expect(() => new HttpClient({ baseUrl: 'http://api.example.com', fetch: fetchMock })).not.toThrow();
    } finally {
      if (originalEnv !== undefined) process.env.GUNSPEC_API_KEY = originalEnv;
    }
  });

  it('leaves a relative, same-origin base URL alone', () => {
    expect(() => make({ baseUrl: '' })).not.toThrow();
    expect(() => make({ baseUrl: '/api' })).not.toThrow();
  });

  it('refuses a base URL that is not a URL', () => {
    expect(() => make({ baseUrl: 'not a url' })).toThrow(ConfigurationError);
  });
});

describe('retry policy', () => {
  it('does not retry a spent daily cap', async () => {
    const client = make({ retry: { maxRetries: 3, initialDelayMs: 1 } });
    fetchMock.mockResolvedValue(json(
      { success: false, error: { code: 'DAILY_CAP_EXCEEDED', reason: 'DAILY_CAP_EXCEEDED', message: 'x' } },
      { status: 429, headers: { 'Retry-After': '1' } },
    ));
    await expect(client.get('/v1/x')).rejects.toBeInstanceOf(RateLimitError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces a Retry-After longer than maxRetryAfterMs instead of sleeping', async () => {
    const client = make({ retry: { maxRetries: 3, initialDelayMs: 1, maxRetryAfterMs: 1000 } });
    fetchMock.mockResolvedValue(json(
      { success: false, error: { code: 'SERVICE_UNAVAILABLE', reason: 'MAINTENANCE', message: 'x' } },
      { status: 503, headers: { 'Retry-After': '600' } },
    ));
    await expect(client.get('/v1/x')).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a short Retry-After on 503', async () => {
    const client = make({ retry: { maxRetries: 1, initialDelayMs: 1 } });
    fetchMock
      .mockResolvedValueOnce(json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'x' } }, { status: 503, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(json({ success: true, data: 'ok' }));
    expect((await client.get<string>('/v1/x')).data).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

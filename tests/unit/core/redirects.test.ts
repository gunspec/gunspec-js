import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '../../../src/core/http-client';
import { ConfigurationError, ConnectionError } from '../../../src/core/errors';
import { FIXTURE_KEY } from '../../helpers/keys';

/*
 * The fetch standard strips `Authorization` on a cross-origin redirect but not
 * a custom header, so letting `fetch` follow redirects sent `X-API-Key` to
 * whatever host a redirect named. These pin the hand-rolled follow in
 * `doFetch`: the key reaches only the base URL's origin.
 */

const fetchMock = vi.fn();

type Init = { method: string; headers: Record<string, string>; body?: string; redirect?: string };
const call = (n: number) => fetchMock.mock.calls[n] as [string, Init];

const redirect = (location: string, status = 302) =>
  new Response(null, { status, headers: { Location: location } });
const bytes = () => new Response(new Uint8Array([7]), { status: 200, headers: { 'Content-Type': 'image/png' } });
const ok = () => new Response(JSON.stringify({ success: true, data: 'ok' }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

function make(config: ConstructorParameters<typeof HttpClient>[0] = {}) {
  return new HttpClient({ auth: { apiKey: FIXTURE_KEY }, retry: { maxRetries: 0 }, fetch: fetchMock, ...config });
}

beforeEach(() => fetchMock.mockReset());

describe('redirects', () => {
  it('never lets fetch follow a redirect on its own', async () => {
    fetchMock.mockResolvedValueOnce(ok());
    await make().get('/v1/x');
    expect(call(0)[1].redirect).toBe('manual');
  });

  it('sends a hop to another origin without X-API-Key', async () => {
    fetchMock.mockResolvedValueOnce(redirect('https://cdn.example.net/a.png')).mockResolvedValueOnce(bytes());
    const raw = await make().getBytes('/v1/firearms/x/media/silhouette');
    expect(Array.from(raw.body)).toEqual([7]);
    expect(call(0)[1].headers['X-API-Key']).toBe(FIXTURE_KEY);
    expect(call(1)[0]).toBe('https://cdn.example.net/a.png');
    expect(call(1)[1].headers['X-API-Key']).toBeUndefined();
    expect(call(1)[1].headers['Accept']).toBe('*/*');
  });

  it('sends a hop to another origin without Authorization under the bearer scheme', async () => {
    fetchMock.mockResolvedValueOnce(redirect('https://cdn.example.net/a.png')).mockResolvedValueOnce(bytes());
    await make({ auth: { apiKey: FIXTURE_KEY, scheme: 'bearer' } }).getBytes('/v1/x');
    expect(call(0)[1].headers['Authorization']).toBe(`Bearer ${FIXTURE_KEY}`);
    expect(call(1)[1].headers['Authorization']).toBeUndefined();
    expect(call(1)[1].headers['X-API-Key']).toBeUndefined();
  });

  it('drops a credential the caller set by hand in any casing', async () => {
    fetchMock.mockResolvedValueOnce(redirect('https://cdn.example.net/a')).mockResolvedValueOnce(ok());
    await make({ auth: { apiKey: null }, headers: { 'x-api-key': 'manual', authorization: 'Bearer manual' } }).get('/v1/x');
    expect(call(0)[1].headers['x-api-key']).toBe('manual');
    expect(Object.keys(call(1)[1].headers).map((h) => h.toLowerCase())).not.toContain('x-api-key');
    expect(Object.keys(call(1)[1].headers).map((h) => h.toLowerCase())).not.toContain('authorization');
  });

  it('keeps the key on a same-origin redirect, relative or absolute', async () => {
    fetchMock
      .mockResolvedValueOnce(redirect('/v1/y', 301))
      .mockResolvedValueOnce(redirect('https://api.gunspec.io/v1/z', 307))
      .mockResolvedValueOnce(ok());
    const res = await make().get<string>('/v1/x');
    expect(res.data).toBe('ok');
    expect(call(1)[0]).toBe('https://api.gunspec.io/v1/y');
    expect(call(1)[1].headers['X-API-Key']).toBe(FIXTURE_KEY);
    expect(call(2)[0]).toBe('https://api.gunspec.io/v1/z');
    expect(call(2)[1].headers['X-API-Key']).toBe(FIXTURE_KEY);
  });

  it('keeps the key off every later hop on a foreign host', async () => {
    fetchMock
      .mockResolvedValueOnce(redirect('https://evil.example/a'))
      .mockResolvedValueOnce(redirect('https://evil.example/b'))
      .mockResolvedValueOnce(ok());
    await make().get('/v1/x');
    expect(call(1)[1].headers['X-API-Key']).toBeUndefined();
    expect(call(2)[1].headers['X-API-Key']).toBeUndefined();
  });

  it('refuses a redirect from https to plain http', async () => {
    fetchMock.mockResolvedValueOnce(redirect('http://cdn.example.net/a.png'));
    const err = await make().getBytes('/v1/x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ConnectionError);
    expect(String((err as Error).message)).toMatch(/https to plain http/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refuses a same-host downgrade too', async () => {
    fetchMock.mockResolvedValueOnce(redirect('http://api.gunspec.io/v1/x'));
    await expect(make().get('/v1/x')).rejects.toBeInstanceOf(ConnectionError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops after five redirects', async () => {
    let n = 0;
    fetchMock.mockImplementation(async () => redirect(`/v1/loop/${n++}`));
    const err = await make().get('/v1/x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ConnectionError);
    expect(String((err as Error).message)).toMatch(/after 5 redirects/);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it('turns a POST answered 303 into a GET without the body, and repeats it on a 307', async () => {
    fetchMock.mockResolvedValueOnce(redirect('/v1/done', 303)).mockResolvedValueOnce(ok());
    await make().post('/v1/x', { a: 1 });
    expect(call(1)[1].method).toBe('GET');
    expect(call(1)[1].body).toBeUndefined();
    expect(call(1)[1].headers['Content-Type']).toBeUndefined();

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(redirect('/v1/again', 307)).mockResolvedValueOnce(ok());
    await make().post('/v1/x', { a: 1 });
    expect(call(1)[1].method).toBe('POST');
    expect(call(1)[1].body).toBe('{"a":1}');
  });

  it('returns a 3xx without a Location as it is', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 304 }));
    const res = await make().requestConditional({ method: 'GET', path: '/v1/x', ifNoneMatch: '"a"' });
    expect(res.notModified).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  describe('opaque redirects (browsers)', () => {
    const opaque = () => {
      const res = new Response(null, { status: 200 });
      Object.defineProperty(res, 'type', { value: 'opaqueredirect' });
      Object.defineProperty(res, 'status', { value: 0 });
      return res;
    };

    it('refuses under X-API-Key, since the header would travel with the redirect', async () => {
      fetchMock.mockResolvedValueOnce(opaque());
      const err = await make().getBytes('/v1/x').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ConfigurationError);
      expect(String((err as Error).message)).toMatch(/authScheme: 'bearer'/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('lets the runtime follow under the bearer scheme, which it strips cross-origin', async () => {
      fetchMock.mockResolvedValueOnce(opaque()).mockResolvedValueOnce(bytes());
      await make({ auth: { apiKey: FIXTURE_KEY, scheme: 'bearer' } }).getBytes('/v1/x');
      expect(call(1)[1].redirect).toBe('follow');
    });
  });
});

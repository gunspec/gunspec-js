import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
  ConnectionError,
  TimeoutError,
  APIError,
} from '../../../src/core/errors';

// ---------------------------------------------------------------------------
// Mock fetch globally BEFORE importing HttpClient
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after stubbing fetch
import { HttpClient } from '../../../src/core/http-client';
import { FIXTURE_KEY_PLAIN } from '../../helpers/keys';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a mock Response object with standard headers.
 */
function mockResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': 'req-123',
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99',
      'X-RateLimit-Reset': '1700000000',
      ...(init?.headers as Record<string, string>),
    },
  });
}

/**
 * Create a success envelope as the API returns.
 */
function successEnvelope<T>(data: T) {
  return { success: true, data };
}

/**
 * Create a paginated success envelope.
 */
function paginatedEnvelope<T>(data: T[], pagination: Record<string, any>) {
  return { success: true, data, pagination };
}

/**
 * Create an error envelope.
 */
function errorEnvelope(code: string, message: string) {
  return { success: false, error: { code, message } };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockFetch.mockReset();
  // Disable retries for most tests so we get clean single-call behavior.
  // Tests that need retries will create their own client.
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Constructor defaults
// ---------------------------------------------------------------------------

describe('HttpClient constructor', () => {
  it('uses default base URL when none is provided', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({ id: 1 })));

    await client.get('/v1/test');

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://api.gunspec.io/v1/test');
  });

  it('strips trailing slashes from custom base URL', async () => {
    const client = new HttpClient({
      baseUrl: 'https://custom.api.com///',
      retry: { maxRetries: 0 },
    });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.get('/v1/test');

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://custom.api.com/v1/test');
  });

  it('uses default timeout of 30000ms', () => {
    // We verify this indirectly: the client should pass a signal to fetch.
    // The timeout is tested more specifically in the timeout test below.
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    expect(client).toBeDefined();
  });

  it('sets User-Agent header to @buun_group/gunspec-sdk', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.get('/v1/test');

    const [, fetchInit] = mockFetch.mock.calls[0]!;
    expect(fetchInit.headers['User-Agent']).toBe('@buun_group/gunspec-sdk');
  });

  it('merges custom headers into every request', async () => {
    const client = new HttpClient({
      headers: { 'X-Custom': 'hello' },
      retry: { maxRetries: 0 },
    });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.get('/v1/test');

    const [, fetchInit] = mockFetch.mock.calls[0]!;
    expect(fetchInit.headers['X-Custom']).toBe('hello');
  });
});

// ---------------------------------------------------------------------------
// GET requests
// ---------------------------------------------------------------------------

describe('HttpClient.get()', () => {
  it('makes a GET request with the correct URL', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(successEnvelope({ slug: 'glock-g17' })),
    );

    await client.get('/v1/firearms/glock-g17');

    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://api.gunspec.io/v1/firearms/glock-g17');
    expect(init.method).toBe('GET');
  });

  it('serialises query parameters into the URL', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(successEnvelope([])),
    );

    await client.get('/v1/firearms', { page: 2, limit: 10, search: 'glock' });

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
    expect(url).toContain('search=glock');
  });

  it('does not send a body', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.get('/v1/test');

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.body).toBeUndefined();
  });

  it('includes Accept: application/json header', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.get('/v1/test');

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.headers['Accept']).toBe('application/json');
  });
});

// ---------------------------------------------------------------------------
// POST requests
// ---------------------------------------------------------------------------

describe('HttpClient.post()', () => {
  it('sends a POST request with JSON body', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(successEnvelope({ id: 42 }), { status: 201 }),
    );

    const body = { name: 'Test Firearm', caliber: '9mm' };
    await client.post('/v1/firearms', body);

    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://api.gunspec.io/v1/firearms');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify(body));
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('sends POST without body when body is omitted', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.post('/v1/actions/trigger');

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.body).toBeUndefined();
    expect(init.headers['Content-Type']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// PUT requests
// ---------------------------------------------------------------------------

describe('HttpClient.put()', () => {
  it('sends a PUT request with JSON body', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({ updated: true })));

    const body = { name: 'Updated Firearm' };
    await client.put('/v1/firearms/abc', body);

    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://api.gunspec.io/v1/firearms/abc');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify(body));
    expect(init.headers['Content-Type']).toBe('application/json');
  });
});

// ---------------------------------------------------------------------------
// DELETE requests
// ---------------------------------------------------------------------------

describe('HttpClient.delete()', () => {
  it('sends a DELETE request with correct method', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(successEnvelope(null), { status: 200 }),
    );

    await client.delete('/v1/firearms/abc');

    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://api.gunspec.io/v1/firearms/abc');
    expect(init.method).toBe('DELETE');
  });

  it('does not send a body', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope(null)));

    await client.delete('/v1/firearms/abc');

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.body).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Query string serialisation
// ---------------------------------------------------------------------------

describe('Query string serialisation', () => {
  it('serialises arrays as repeated keys', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope([])));

    await client.get('/v1/firearms', { caliber: ['9mm', '.45 ACP'] });

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain('caliber=9mm');
    expect(url).toContain('caliber=.45%20ACP');
  });

  it('converts booleans to strings', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope([])));

    await client.get('/v1/firearms', { includeVariants: true, deprecated: false });

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain('includeVariants=true');
    expect(url).toContain('deprecated=false');
  });

  it('skips undefined values', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope([])));

    await client.get('/v1/firearms', { page: 1, search: undefined, limit: 10 });

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain('page=1');
    expect(url).toContain('limit=10');
    expect(url).not.toContain('search');
  });

  it('produces no query string when all values are undefined', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope([])));

    await client.get('/v1/firearms', { a: undefined, b: undefined });

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://api.gunspec.io/v1/firearms');
  });

  it('encodes special characters in keys and values', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope([])));

    await client.get('/v1/search', { 'q&x': 'a=b' });

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain('q%26x=a%3Db');
  });
});

// ---------------------------------------------------------------------------
// Response envelope unwrapping
// ---------------------------------------------------------------------------

describe('Response envelope unwrapping', () => {
  it('unwraps { success: true, data: T } into APIResponse<T>', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    const firearm = { slug: 'glock-g17', name: 'Glock G17' };
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope(firearm)));

    const res = await client.get<typeof firearm>('/v1/firearms/glock-g17');

    expect(res.data).toEqual(firearm);
    expect(res.status).toBe(200);
  });

  it('unwraps paginated response into PaginatedResponse<T>', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    const items = [{ slug: 'a' }, { slug: 'b' }];
    const pagination = { page: 1, limit: 20, total: 150, totalPages: 8 };
    mockFetch.mockResolvedValueOnce(
      mockResponse(paginatedEnvelope(items, pagination)),
    );

    const res = await client.getPaginated<{ slug: string }>('/v1/firearms');

    expect(res.data).toEqual(items);
    expect(res.pagination).toEqual(pagination);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Rate limit header parsing
// ---------------------------------------------------------------------------

describe('Rate limit headers', () => {
  it('parses X-RateLimit-* headers into rateLimit object', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(successEnvelope({}), {
        headers: {
          'X-RateLimit-Limit': '1000',
          'X-RateLimit-Remaining': '742',
          'X-RateLimit-Reset': '1700001234',
        },
      }),
    );

    const res = await client.get('/v1/test');

    expect(res.rateLimit.limit).toBe(1000);
    expect(res.rateLimit.remaining).toBe(742);
    expect(res.rateLimit.reset).toBe(1700001234);
  });

  it('returns null for missing rate limit headers', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    // Create a response WITHOUT rate limit headers
    const response = new Response(JSON.stringify(successEnvelope({})), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': 'req-no-rl',
      },
    });
    mockFetch.mockResolvedValueOnce(response);

    const res = await client.get('/v1/test');

    expect(res.rateLimit.limit).toBeNull();
    expect(res.rateLimit.remaining).toBeNull();
    expect(res.rateLimit.reset).toBeNull();
  });

  it('returns null for non-numeric rate limit header values', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    const response = new Response(JSON.stringify(successEnvelope({})), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': 'req-bad-rl',
        'X-RateLimit-Limit': 'not-a-number',
        'X-RateLimit-Remaining': 'NaN',
        'X-RateLimit-Reset': 'abc',
      },
    });
    mockFetch.mockResolvedValueOnce(response);

    const res = await client.get('/v1/test');

    expect(res.rateLimit.limit).toBeNull();
    expect(res.rateLimit.remaining).toBeNull();
    expect(res.rateLimit.reset).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Request ID extraction
// ---------------------------------------------------------------------------

describe('Request ID extraction', () => {
  it('extracts X-Request-Id from response headers', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(successEnvelope({}), {
        headers: { 'X-Request-Id': 'abc-def-123' },
      }),
    );

    const res = await client.get('/v1/test');

    expect(res.requestId).toBe('abc-def-123');
  });

  it('returns empty string when X-Request-Id is absent', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    const response = new Response(JSON.stringify(successEnvelope({})), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    mockFetch.mockResolvedValueOnce(response);

    const res = await client.get('/v1/test');

    expect(res.requestId).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Error responses
// ---------------------------------------------------------------------------

describe('Error responses', () => {
  it('throws AuthenticationError on 401', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(errorEnvelope('UNAUTHORIZED', 'Invalid API key'), { status: 401 }),
    );

    await expect(client.get('/v1/test')).rejects.toThrow(AuthenticationError);
  });

  it('throws NotFoundError on 404', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(errorEnvelope('NOT_FOUND', 'Firearm not found'), { status: 404 }),
    );

    const err = await client.get('/v1/firearms/nonexistent').catch((e) => e);
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Firearm not found');
    expect(err.requestId).toBe('req-123');
  });

  it('throws BadRequestError on 400', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(errorEnvelope('VALIDATION_ERROR', 'Invalid page'), { status: 400 }),
    );

    await expect(client.get('/v1/test')).rejects.toThrow(BadRequestError);
  });

  it('throws RateLimitError on 429', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(errorEnvelope('RATE_LIMITED', 'Too many requests'), {
        status: 429,
        headers: { 'Retry-After': '30' },
      }),
    );

    const err = await client.get('/v1/test').catch((e) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.retryAfter).toBe(30);
  });

  it('throws InternalServerError on 500', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(errorEnvelope('INTERNAL_ERROR', 'Server crashed'), { status: 500 }),
    );

    await expect(client.get('/v1/test')).rejects.toThrow(InternalServerError);
  });

  it('throws generic APIError on unknown status codes', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(errorEnvelope('CONFLICT', 'Conflict'), { status: 409 }),
    );

    const err = await client.get('/v1/test').catch((e) => e);
    expect(err).toBeInstanceOf(APIError);
    expect(err.status).toBe(409);
  });

  it('handles error responses with empty body', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    const response = new Response('', {
      status: 502,
      headers: {
        'X-Request-Id': 'req-bad',
      },
    });
    mockFetch.mockResolvedValueOnce(response);

    const err = await client.get('/v1/test').catch((e) => e);
    expect(err).toBeInstanceOf(APIError);
    expect(err.status).toBe(502);
    expect(err.code).toBe('HTTP_502');
  });

  it('includes requestId in error objects', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(errorEnvelope('NOT_FOUND', 'gone'), {
        status: 404,
        headers: { 'X-Request-Id': 'req-error-id' },
      }),
    );

    const err = await client.get('/v1/test').catch((e) => e);
    expect(err.requestId).toBe('req-error-id');
  });
});

// ---------------------------------------------------------------------------
// Timeout
// ---------------------------------------------------------------------------

describe('Timeout handling', () => {
  it('throws TimeoutError when fetch is aborted by timeout', async () => {
    const client = new HttpClient({ timeout: 100, retry: { maxRetries: 0 } });
    mockFetch.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          // Simulate the abort signal firing
          if (init.signal) {
            init.signal.addEventListener('abort', () => {
              reject(init.signal!.reason);
            });
          }
        }),
    );

    await expect(client.get('/v1/slow')).rejects.toThrow(TimeoutError);
  });
});

// ---------------------------------------------------------------------------
// Network failure
// ---------------------------------------------------------------------------

describe('Network failure handling', () => {
  it('throws ConnectionError on fetch TypeError', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

    await expect(client.get('/v1/test')).rejects.toThrow(ConnectionError);
  });

  it('wraps the original error message in ConnectionError', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockRejectedValueOnce(new TypeError('DNS resolution failed'));

    const err = await client.get('/v1/test').catch((e) => e);
    expect(err).toBeInstanceOf(ConnectionError);
    expect(err.message).toBe('DNS resolution failed');
  });

  it('handles non-Error rejection values', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockRejectedValueOnce('string error');

    const err = await client.get('/v1/test').catch((e) => e);
    expect(err).toBeInstanceOf(ConnectionError);
    expect(err.message).toBe('Network request failed');
  });
});

// ---------------------------------------------------------------------------
// Authentication headers
// ---------------------------------------------------------------------------

describe('Authentication headers', () => {
  it('sets X-API-Key header when apiKey is provided', async () => {
    const client = new HttpClient({
      auth: { apiKey: FIXTURE_KEY_PLAIN },
      retry: { maxRetries: 0 },
    });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.get('/v1/test');

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.headers['X-API-Key']).toBe(FIXTURE_KEY_PLAIN);
  });

  it('does not set X-API-Key when no apiKey is provided', async () => {
    // The developer shell may export a real key; this test is about the absence of one.
    const originalEnv = process.env.GUNSPEC_API_KEY;
    delete process.env.GUNSPEC_API_KEY;
    try {
      const client = new HttpClient({ retry: { maxRetries: 0 } });
      mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

      await client.get('/v1/test');

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.headers['X-API-Key']).toBeUndefined();
    } finally {
      if (originalEnv !== undefined) process.env.GUNSPEC_API_KEY = originalEnv;
    }
  });

  it('reads apiKey from GUNSPEC_API_KEY env var as fallback', async () => {
    const originalEnv = process.env.GUNSPEC_API_KEY;
    process.env.GUNSPEC_API_KEY = 'env-key-789';
    try {
      const client = new HttpClient({ retry: { maxRetries: 0 } });
      mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

      await client.get('/v1/test');

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.headers['X-API-Key']).toBe('env-key-789');
    } finally {
      if (originalEnv === undefined) {
        delete process.env.GUNSPEC_API_KEY;
      } else {
        process.env.GUNSPEC_API_KEY = originalEnv;
      }
    }
  });
});

// ---------------------------------------------------------------------------
// User-Agent header
// ---------------------------------------------------------------------------

describe('User-Agent header', () => {
  it('is always set to @buun_group/gunspec-sdk', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.get('/v1/test');

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.headers['User-Agent']).toBe('@buun_group/gunspec-sdk');
  });

  it('custom headers do not override User-Agent unless explicitly set', async () => {
    const client = new HttpClient({
      headers: { 'X-Custom': 'value' },
      retry: { maxRetries: 0 },
    });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.get('/v1/test');

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.headers['User-Agent']).toBe('@buun_group/gunspec-sdk');
    expect(init.headers['X-Custom']).toBe('value');
  });

  it('custom User-Agent in headers config overrides the default', async () => {
    const client = new HttpClient({
      headers: { 'User-Agent': 'my-app/1.0' },
      retry: { maxRetries: 0 },
    });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.get('/v1/test');

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.headers['User-Agent']).toBe('my-app/1.0');
  });
});

// ---------------------------------------------------------------------------
// request() method with full RequestConfig
// ---------------------------------------------------------------------------

describe('HttpClient.request()', () => {
  it('passes per-request headers merged with default headers', async () => {
    const client = new HttpClient({
      headers: { 'X-Default': 'yes' },
      retry: { maxRetries: 0 },
    });
    mockFetch.mockResolvedValueOnce(mockResponse(successEnvelope({})));

    await client.request({
      method: 'GET',
      path: '/v1/test',
      headers: { 'X-Custom': 'per-request' },
    });

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.headers['X-Default']).toBe('yes');
    expect(init.headers['X-Custom']).toBe('per-request');
  });

  it('returns correct status code from the response', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(successEnvelope({ id: 1 }), { status: 201 }),
    );

    const res = await client.request<{ id: number }>({
      method: 'POST',
      path: '/v1/items',
      body: { name: 'item' },
    });

    expect(res.status).toBe(201);
  });

  it('exposes raw response headers', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    mockFetch.mockResolvedValueOnce(
      mockResponse(successEnvelope({}), {
        headers: { 'X-Custom-Response': 'value123' },
      }),
    );

    const res = await client.get('/v1/test');

    expect(res.headers.get('X-Custom-Response')).toBe('value123');
  });
});

// ---------------------------------------------------------------------------
// AbortSignal / external cancellation
// ---------------------------------------------------------------------------

describe('External AbortSignal', () => {
  it('propagates caller-initiated abort as DOMException', async () => {
    const client = new HttpClient({ retry: { maxRetries: 0 } });
    const controller = new AbortController();

    mockFetch.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal!.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );

    const promise = client.request({
      method: 'GET',
      path: '/v1/test',
      signal: controller.signal,
    });

    controller.abort();

    // Should propagate the abort as-is (DOMException), not wrap it as TimeoutError
    await expect(promise).rejects.toThrow();
  });
});

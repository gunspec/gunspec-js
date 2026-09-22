import { vi } from 'vitest';

export function createMockClient() {
  return {
    get: vi.fn(),
    getPaginated: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    requestPaginated: vi.fn(),
    requestConditional: vi.fn(),
    requestRaw: vi.fn(),
    getText: vi.fn(),
    getBytes: vi.fn(),
    resolveRedirect: vi.fn(),
    urlFor: vi.fn((path: string, query?: Record<string, unknown>) => {
      const qs = query
        ? Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
        : '';
      return `https://api.gunspec.io${path}${qs ? `?${qs}` : ''}`;
    }),
    isAuthenticated: true,
  };
}

export type MockClient = ReturnType<typeof createMockClient>;

/** Standard single-resource mock response. */
export function mockApiResponse<T>(data: T) {
  return {
    data,
    status: 200,
    headers: new Headers(),
    requestId: 'req-test',
    rateLimit: { limit: 100, remaining: 99, reset: null },
    etag: null,
    cacheControl: null,
    fromCache: false,
  };
}

/** Standard raw (bytes) mock response. */
export function mockRawResponse(text: string, contentType = 'application/octet-stream') {
  return {
    body: new TextEncoder().encode(text),
    contentType,
    url: 'https://api.gunspec.io/raw',
    status: 200,
    headers: new Headers(),
    requestId: 'req-test',
    rateLimit: { limit: 100, remaining: 99, reset: null },
    etag: null,
    cacheControl: null,
  };
}

/** Standard paginated mock response. */
export function mockPaginatedResponse<T>(data: T[], page = 1, totalPages = 1) {
  return {
    data,
    pagination: { page, limit: 20, per_page: 20, total: data.length, totalPages },
    status: 200,
    headers: new Headers(),
    requestId: 'req-test',
    rateLimit: { limit: 100, remaining: 99, reset: null },
    etag: null,
    cacheControl: null,
    fromCache: false,
  };
}

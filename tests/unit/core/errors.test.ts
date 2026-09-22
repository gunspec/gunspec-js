import { describe, it, expect } from 'vitest';
import {
  GunSpecError,
  APIError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  BadRequestError,
  RateLimitError,
  InternalServerError,
  ConnectionError,
  TimeoutError,
  createAPIError,
} from '../../../src/core/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHeaders(extra: Record<string, string> = {}): Headers {
  return new Headers({ 'Content-Type': 'application/json', ...extra });
}

function makeErrorBody(code: string, message: string) {
  return { success: false as const, error: { code, message } };
}

// ---------------------------------------------------------------------------
// GunSpecError (base)
// ---------------------------------------------------------------------------

describe('GunSpecError', () => {
  it('is an instance of Error', () => {
    const err = new GunSpecError('something went wrong');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GunSpecError);
  });

  it('has the correct name property', () => {
    const err = new GunSpecError('oops');
    expect(err.name).toBe('GunSpecError');
  });

  it('stores the message', () => {
    const err = new GunSpecError('test message');
    expect(err.message).toBe('test message');
  });

  it('produces a proper stack trace', () => {
    const err = new GunSpecError('stacky');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('stacky');
  });
});

// ---------------------------------------------------------------------------
// APIError
// ---------------------------------------------------------------------------

describe('APIError', () => {
  it('extends GunSpecError', () => {
    const headers = makeHeaders();
    const err = new APIError(502, 'BAD_GATEWAY', 'bad gateway', 'req-1', headers);
    expect(err).toBeInstanceOf(GunSpecError);
    expect(err).toBeInstanceOf(APIError);
  });

  it('stores status, code, requestId, and headers', () => {
    const headers = makeHeaders();
    const err = new APIError(418, 'TEAPOT', 'I am a teapot', 'req-42', headers);
    expect(err.status).toBe(418);
    expect(err.code).toBe('TEAPOT');
    expect(err.message).toBe('I am a teapot');
    expect(err.requestId).toBe('req-42');
    expect(err.headers).toBe(headers);
  });

  it('has the correct name property', () => {
    const err = new APIError(500, 'ERR', 'msg', '', makeHeaders());
    expect(err.name).toBe('APIError');
  });
});

// ---------------------------------------------------------------------------
// AuthenticationError (401)
// ---------------------------------------------------------------------------

describe('AuthenticationError', () => {
  it('extends APIError and GunSpecError', () => {
    const err = new AuthenticationError('UNAUTHORIZED', 'Invalid key', 'req-1', makeHeaders());
    expect(err).toBeInstanceOf(APIError);
    expect(err).toBeInstanceOf(GunSpecError);
    expect(err).toBeInstanceOf(AuthenticationError);
  });

  it('has status 401', () => {
    const err = new AuthenticationError('UNAUTHORIZED', 'bad key', 'req-2', makeHeaders());
    expect(err.status).toBe(401);
  });

  it('has the correct name property', () => {
    const err = new AuthenticationError('CODE', 'msg', '', makeHeaders());
    expect(err.name).toBe('AuthenticationError');
  });
});

// ---------------------------------------------------------------------------
// PermissionError (403)
// ---------------------------------------------------------------------------

describe('PermissionError', () => {
  it('extends APIError', () => {
    const err = new PermissionError('FORBIDDEN', 'not allowed', 'req-1', makeHeaders());
    expect(err).toBeInstanceOf(APIError);
    expect(err).toBeInstanceOf(PermissionError);
  });

  it('has status 403', () => {
    const err = new PermissionError('FORBIDDEN', 'no access', 'req-1', makeHeaders());
    expect(err.status).toBe(403);
  });

  it('has the correct name property', () => {
    const err = new PermissionError('CODE', 'msg', '', makeHeaders());
    expect(err.name).toBe('PermissionError');
  });
});

// ---------------------------------------------------------------------------
// NotFoundError (404)
// ---------------------------------------------------------------------------

describe('NotFoundError', () => {
  it('extends APIError', () => {
    const err = new NotFoundError('NOT_FOUND', 'not found', 'req-1', makeHeaders());
    expect(err).toBeInstanceOf(APIError);
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it('has status 404', () => {
    const err = new NotFoundError('NOT_FOUND', 'gone', 'req-1', makeHeaders());
    expect(err.status).toBe(404);
  });

  it('has the correct name property', () => {
    const err = new NotFoundError('CODE', 'msg', '', makeHeaders());
    expect(err.name).toBe('NotFoundError');
  });
});

// ---------------------------------------------------------------------------
// BadRequestError (400)
// ---------------------------------------------------------------------------

describe('BadRequestError', () => {
  it('extends APIError', () => {
    const err = new BadRequestError('BAD_REQUEST', 'invalid', 'req-1', makeHeaders());
    expect(err).toBeInstanceOf(APIError);
    expect(err).toBeInstanceOf(BadRequestError);
  });

  it('has status 400', () => {
    const err = new BadRequestError('BAD_REQUEST', 'bad', 'req-1', makeHeaders());
    expect(err.status).toBe(400);
  });

  it('has the correct name property', () => {
    const err = new BadRequestError('CODE', 'msg', '', makeHeaders());
    expect(err.name).toBe('BadRequestError');
  });
});

// ---------------------------------------------------------------------------
// RateLimitError (429)
// ---------------------------------------------------------------------------

describe('RateLimitError', () => {
  it('extends APIError', () => {
    const err = new RateLimitError('RATE_LIMITED', 'slow down', 'req-1', makeHeaders(), 60);
    expect(err).toBeInstanceOf(APIError);
    expect(err).toBeInstanceOf(RateLimitError);
  });

  it('has status 429', () => {
    const err = new RateLimitError('RATE_LIMITED', 'too fast', 'req-1', makeHeaders(), 30);
    expect(err.status).toBe(429);
  });

  it('stores the retryAfter value', () => {
    const err = new RateLimitError('RATE_LIMITED', 'slow', 'req-1', makeHeaders(), 120);
    expect(err.retryAfter).toBe(120);
  });

  it('retryAfter can be null', () => {
    const err = new RateLimitError('RATE_LIMITED', 'slow', 'req-1', makeHeaders(), null);
    expect(err.retryAfter).toBeNull();
  });

  it('has the correct name property', () => {
    const err = new RateLimitError('CODE', 'msg', '', makeHeaders(), null);
    expect(err.name).toBe('RateLimitError');
  });
});

// ---------------------------------------------------------------------------
// InternalServerError (500)
// ---------------------------------------------------------------------------

describe('InternalServerError', () => {
  it('extends APIError', () => {
    const err = new InternalServerError('INTERNAL', 'boom', 'req-1', makeHeaders());
    expect(err).toBeInstanceOf(APIError);
    expect(err).toBeInstanceOf(InternalServerError);
  });

  it('has status 500', () => {
    const err = new InternalServerError('INTERNAL', 'crash', 'req-1', makeHeaders());
    expect(err.status).toBe(500);
  });

  it('has the correct name property', () => {
    const err = new InternalServerError('CODE', 'msg', '', makeHeaders());
    expect(err.name).toBe('InternalServerError');
  });
});

// ---------------------------------------------------------------------------
// ConnectionError
// ---------------------------------------------------------------------------

describe('ConnectionError', () => {
  it('extends GunSpecError', () => {
    const err = new ConnectionError('network failed', new TypeError('fetch failed'));
    expect(err).toBeInstanceOf(GunSpecError);
    expect(err).toBeInstanceOf(ConnectionError);
  });

  it('is NOT an instance of APIError', () => {
    const err = new ConnectionError('network failed', null);
    expect(err).not.toBeInstanceOf(APIError);
  });

  it('stores the cause', () => {
    const original = new TypeError('DNS failure');
    const err = new ConnectionError('connection failed', original);
    expect(err.cause).toBe(original);
  });

  it('has the correct name property', () => {
    const err = new ConnectionError('msg', null);
    expect(err.name).toBe('ConnectionError');
  });
});

// ---------------------------------------------------------------------------
// TimeoutError
// ---------------------------------------------------------------------------

describe('TimeoutError', () => {
  it('extends GunSpecError', () => {
    const err = new TimeoutError(5000);
    expect(err).toBeInstanceOf(GunSpecError);
    expect(err).toBeInstanceOf(TimeoutError);
  });

  it('is NOT an instance of APIError', () => {
    const err = new TimeoutError(1000);
    expect(err).not.toBeInstanceOf(APIError);
  });

  it('stores timeoutMs and generates a descriptive message', () => {
    const err = new TimeoutError(30000);
    expect(err.timeoutMs).toBe(30000);
    expect(err.message).toBe('Request timed out after 30000ms');
  });

  it('has the correct name property', () => {
    const err = new TimeoutError(1000);
    expect(err.name).toBe('TimeoutError');
  });
});

// ---------------------------------------------------------------------------
// createAPIError factory
// ---------------------------------------------------------------------------

describe('createAPIError', () => {
  it('returns BadRequestError for status 400', () => {
    const body = makeErrorBody('VALIDATION_ERROR', 'Invalid param');
    const err = createAPIError(400, body, 'req-1', makeHeaders());
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid param');
    expect(err.requestId).toBe('req-1');
  });

  it('returns AuthenticationError for status 401', () => {
    const body = makeErrorBody('UNAUTHORIZED', 'Invalid API key');
    const err = createAPIError(401, body, 'req-2', makeHeaders());
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('returns PermissionError for status 403', () => {
    const body = makeErrorBody('FORBIDDEN', 'Insufficient tier');
    const err = createAPIError(403, body, 'req-3', makeHeaders());
    expect(err).toBeInstanceOf(PermissionError);
    expect(err.status).toBe(403);
  });

  it('returns NotFoundError for status 404', () => {
    const body = makeErrorBody('NOT_FOUND', 'Resource not found');
    const err = createAPIError(404, body, 'req-4', makeHeaders());
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.status).toBe(404);
  });

  it('returns RateLimitError for status 429 with Retry-After header', () => {
    const headers = makeHeaders({ 'Retry-After': '60' });
    const body = makeErrorBody('RATE_LIMITED', 'Too many requests');
    const err = createAPIError(429, body, 'req-5', headers);
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.status).toBe(429);
    expect((err as RateLimitError).retryAfter).toBe(60);
  });

  it('returns RateLimitError for status 429 without Retry-After header', () => {
    const body = makeErrorBody('RATE_LIMITED', 'Slow down');
    const err = createAPIError(429, body, 'req-6', makeHeaders());
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).retryAfter).toBeNull();
  });

  it('returns InternalServerError for status 500', () => {
    const body = makeErrorBody('INTERNAL_ERROR', 'Something broke');
    const err = createAPIError(500, body, 'req-7', makeHeaders());
    expect(err).toBeInstanceOf(InternalServerError);
    expect(err.status).toBe(500);
  });

  it('returns generic APIError for unknown status codes', () => {
    const body = makeErrorBody('CONFLICT', 'Resource conflict');
    const err = createAPIError(409, body, 'req-8', makeHeaders());
    expect(err).toBeInstanceOf(APIError);
    expect(err).not.toBeInstanceOf(BadRequestError);
    expect(err).not.toBeInstanceOf(AuthenticationError);
    expect(err).not.toBeInstanceOf(NotFoundError);
    expect(err.status).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('uses fallback code and message when body is null', () => {
    const err = createAPIError(502, null, 'req-9', makeHeaders());
    expect(err).toBeInstanceOf(APIError);
    expect(err.status).toBe(502);
    expect(err.code).toBe('HTTP_502');
    expect(err.message).toBe('Request failed with status 502');
  });

  it('uses fallback code when body.error is missing fields', () => {
    const err = createAPIError(503, null, 'req-10', makeHeaders());
    expect(err.code).toBe('HTTP_503');
    expect(err.message).toBe('Request failed with status 503');
  });

  it('all created errors are instanceof GunSpecError', () => {
    const statuses = [400, 401, 403, 404, 429, 500, 502];
    for (const status of statuses) {
      const body = makeErrorBody('CODE', 'msg');
      const headers = status === 429 ? makeHeaders({ 'Retry-After': '10' }) : makeHeaders();
      const err = createAPIError(status, body, 'req', headers);
      expect(err).toBeInstanceOf(GunSpecError);
      expect(err).toBeInstanceOf(APIError);
    }
  });

  it('parses Retry-After as HTTP-date for 429 responses', () => {
    // Use a date in the future
    const futureDate = new Date(Date.now() + 120_000);
    const headers = makeHeaders({ 'Retry-After': futureDate.toUTCString() });
    const body = makeErrorBody('RATE_LIMITED', 'slow');
    const err = createAPIError(429, body, 'req', headers);
    expect(err).toBeInstanceOf(RateLimitError);
    const retryAfter = (err as RateLimitError).retryAfter;
    expect(retryAfter).not.toBeNull();
    // Should be roughly 120 seconds (allow some tolerance)
    expect(retryAfter!).toBeGreaterThan(100);
    expect(retryAfter!).toBeLessThanOrEqual(121);
  });
});

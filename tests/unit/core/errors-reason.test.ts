import { describe, it, expect } from 'vitest';
import {
  createAPIError,
  APIError,
  BadRequestError,
  AuthenticationError,
  PermissionError,
  ConflictError,
  PayloadTooLargeError,
  RateLimitError,
  ServiceUnavailableError,
} from '../../../src/core/errors';

const headers = (extra: Record<string, string> = {}) => new Headers(extra);

describe('APIError.reason', () => {
  it('is read from the body', () => {
    const err = createAPIError(401, { success: false, error: { code: 'UNAUTHORIZED', reason: 'KEY_EXPIRED', message: 'expired' } }, 'r1', headers());
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.reason).toBe('KEY_EXPIRED');
    expect(err.action).toMatch(/new key/i);
  });

  it('falls back to the status default when the body has none', () => {
    expect(createAPIError(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'x' } }, '', headers()).reason).toBe('AUTH_REQUIRED');
    expect(createAPIError(403, null, '', headers()).reason).toBe('ACTION_NOT_ALLOWED');
    expect(createAPIError(404, null, '', headers()).reason).toBe('RESOURCE_NOT_FOUND');
    expect(createAPIError(429, null, '', headers()).reason).toBe('RATE_LIMITED');
    expect(createAPIError(418, null, '', headers()).reason).toBe('INTERNAL_ERROR');
  });

  it('ignores a reason the SDK does not know rather than throwing', () => {
    const err = createAPIError(403, { success: false, error: { code: 'FORBIDDEN', reason: 'SOMETHING_NEW', message: 'x' } }, '', headers());
    expect(err.reason).toBe('ACTION_NOT_ALLOWED');
  });

  it('uses request_id from the body when the header is absent', () => {
    const err = createAPIError(500, { success: false, error: { code: 'INTERNAL_ERROR', message: 'x', request_id: 'body-id' } }, '', headers());
    expect(err.requestId).toBe('body-id');
  });
});

describe('APIError.details', () => {
  it('collects details and any extra envelope fields', () => {
    const err = createAPIError(400, {
      success: false,
      error: { code: 'VALIDATION_ERROR', reason: 'INVALID_PARAMETER', message: 'bad', details: { fields: ['q'] }, hint: 'x' },
    }, '', headers());
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.details).toEqual({ fields: ['q'], hint: 'x' });
  });

  it('is undefined when the body carries nothing beyond the core fields', () => {
    const err = createAPIError(404, { success: false, error: { code: 'NOT_FOUND', message: 'x', request_id: 'r' } }, 'r', headers());
    expect(err.details).toBeUndefined();
  });

  it('exposes requiredTier on a PLAN_REQUIRED 403', () => {
    const err = createAPIError(403, {
      success: false,
      error: { code: 'SUBSCRIPTION_REQUIRED', reason: 'PLAN_REQUIRED', message: 'x', details: { requiredTier: 'studio' } },
    }, '', headers()) as PermissionError;
    expect(err).toBeInstanceOf(PermissionError);
    expect(err.requiredTier).toBe('studio');
  });

  it('exposes maxBytes on a 413', () => {
    const err = createAPIError(413, { success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'x', maxBytes: 1024 } }, '', headers()) as PayloadTooLargeError;
    expect(err).toBeInstanceOf(PayloadTooLargeError);
    expect(err.maxBytes).toBe(1024);
  });
});

describe('new status subclasses', () => {
  it('maps 409 to ConflictError', () => {
    expect(createAPIError(409, null, '', headers())).toBeInstanceOf(ConflictError);
  });

  it('maps 503 to ServiceUnavailableError with Retry-After', () => {
    const err = createAPIError(503, { success: false, error: { code: 'SERVICE_UNAVAILABLE', reason: 'MAINTENANCE', message: 'x' } }, '', headers({ 'Retry-After': '120' }));
    expect(err).toBeInstanceOf(ServiceUnavailableError);
    expect(err.reason).toBe('MAINTENANCE');
    expect(err.retryAfter).toBe(120);
  });

  it('keeps the base class for unmapped statuses', () => {
    const err = createAPIError(502, null, '', headers());
    expect(err.constructor).toBe(APIError);
  });
});

describe('RateLimitError', () => {
  it('flags a daily cap', () => {
    const err = createAPIError(429, { success: false, error: { code: 'DAILY_CAP_EXCEEDED', reason: 'DAILY_CAP_EXCEEDED', message: 'x' } }, '', headers({ 'Retry-After': '3600' })) as RateLimitError;
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.isDailyCap).toBe(true);
    expect(err.retryAfter).toBe(3600);
  });

  it('keeps the positional constructor for existing callers', () => {
    const err = new RateLimitError('RATE_LIMITED', 'slow', 'r', headers(), 7);
    expect(err.retryAfter).toBe(7);
    expect(err.isDailyCap).toBe(false);
    expect(err.reason).toBe('RATE_LIMITED');
  });
});

describe('APIError.toJSON', () => {
  it('serialises the fields a log line needs and nothing sensitive', () => {
    const err = createAPIError(403, {
      success: false,
      error: { code: 'FORBIDDEN', reason: 'ACCOUNT_SUSPENDED', message: 'suspended', details: { since: '2026-01-01' } },
    }, 'req-9', headers());
    const json = err.toJSON();
    expect(json).toEqual({
      name: 'PermissionError',
      status: 403,
      code: 'FORBIDDEN',
      reason: 'ACCOUNT_SUSPENDED',
      message: 'suspended',
      requestId: 'req-9',
      details: { since: '2026-01-01' },
    });
    expect(JSON.stringify(err)).not.toContain('headers');
  });
});

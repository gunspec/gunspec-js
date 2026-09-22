import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveApiKey, buildAuthHeaders } from '../../../src/core/auth';
import { FIXTURE_KEY, FIXTURE_KEY_PLAIN } from '../../helpers/keys';

// ---------------------------------------------------------------------------
// resolveApiKey
// ---------------------------------------------------------------------------

describe('resolveApiKey', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // Clone the environment so mutations don't leak between tests.
    process.env = { ...ORIGINAL_ENV };
    delete process.env.GUNSPEC_API_KEY;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns the explicit apiKey when provided', () => {
    const key = resolveApiKey({ apiKey: FIXTURE_KEY_PLAIN });
    expect(key).toBe(FIXTURE_KEY_PLAIN);
  });

  it('ignores the environment variable when an explicit key is set', () => {
    process.env.GUNSPEC_API_KEY = 'env-key';
    const key = resolveApiKey({ apiKey: FIXTURE_KEY });
    expect(key).toBe(FIXTURE_KEY);
  });

  it('falls back to GUNSPEC_API_KEY environment variable', () => {
    process.env.GUNSPEC_API_KEY = 'env-key-123';
    const key = resolveApiKey({});
    expect(key).toBe('env-key-123');
  });

  it('returns undefined when no key is available', () => {
    const key = resolveApiKey({});
    expect(key).toBeUndefined();
  });

  it('treats an empty string apiKey as absent and falls back to env', () => {
    process.env.GUNSPEC_API_KEY = 'env-key';
    const key = resolveApiKey({ apiKey: '' });
    expect(key).toBe('env-key');
  });

  it('returns undefined when apiKey is empty and env is not set', () => {
    const key = resolveApiKey({ apiKey: '' });
    expect(key).toBeUndefined();
  });

  it('returns undefined for null even when the env var is set', () => {
    process.env.GUNSPEC_API_KEY = 'env-key';
    expect(resolveApiKey({ apiKey: null })).toBeUndefined();
  });

  it('returns undefined when apiKey is undefined explicitly', () => {
    const key = resolveApiKey({ apiKey: undefined });
    expect(key).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// buildAuthHeaders
// ---------------------------------------------------------------------------

describe('buildAuthHeaders', () => {
  it('returns X-API-Key header when key is provided', () => {
    const headers = buildAuthHeaders('test-key-456');
    expect(headers).toEqual({ 'X-API-Key': 'test-key-456' });
  });

  it('returns an empty object when key is undefined', () => {
    const headers = buildAuthHeaders(undefined);
    expect(headers).toEqual({});
  });

  it('returns an empty object when key is an empty string', () => {
    const headers = buildAuthHeaders('');
    expect(headers).toEqual({});
  });

  it('does not include extraneous properties', () => {
    const headers = buildAuthHeaders('key');
    expect(Object.keys(headers)).toEqual(['X-API-Key']);
  });

  it('preserves the exact key value without modification', () => {
    const key = '  spaces-and-stuff_123!@#  ';
    const headers = buildAuthHeaders(key);
    expect(headers['X-API-Key']).toBe(key);
  });
});

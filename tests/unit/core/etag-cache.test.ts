import { describe, it, expect } from 'vitest';
import { MemoryETagStore, credentialFingerprint, cacheKeyFor } from '../../../src/core/etag-cache';
import { FIXTURE_KEY } from '../../helpers/keys';

const entry = (etag: string) => ({ etag, body: `{"data":"${etag}"}`, storedAt: 0 });

describe('MemoryETagStore', () => {
  it('returns what was set', () => {
    const store = new MemoryETagStore();
    store.set('a', entry('"1"'));
    expect(store.get('a')?.etag).toBe('"1"');
    expect(store.get('b')).toBeUndefined();
  });

  it('evicts the least recently used entry past the bound', () => {
    const store = new MemoryETagStore(2);
    store.set('a', entry('"a"'));
    store.set('b', entry('"b"'));
    store.get('a'); // a is now most recent
    store.set('c', entry('"c"'));
    expect(store.get('b')).toBeUndefined();
    expect(store.get('a')?.etag).toBe('"a"');
    expect(store.get('c')?.etag).toBe('"c"');
    expect(store.size).toBe(2);
  });

  it('replaces an existing key without growing', () => {
    const store = new MemoryETagStore(1);
    store.set('a', entry('"1"'));
    store.set('a', entry('"2"'));
    expect(store.size).toBe(1);
    expect(store.get('a')?.etag).toBe('"2"');
  });

  it('refuses a non-positive bound', () => {
    expect(() => new MemoryETagStore(0)).toThrow(RangeError);
  });

  it('clears', () => {
    const store = new MemoryETagStore();
    store.set('a', entry('"1"'));
    store.clear();
    expect(store.size).toBe(0);
  });
});

describe('credentialFingerprint', () => {
  it('is stable for the same key and different across keys', () => {
    expect(credentialFingerprint('gsk_abc')).toBe(credentialFingerprint('gsk_abc'));
    expect(credentialFingerprint('gsk_abc')).not.toBe(credentialFingerprint('gsk_abd'));
  });

  it('never contains the key', () => {
    const key = FIXTURE_KEY;
    expect(credentialFingerprint(key)).not.toContain('gsk_');
    expect(credentialFingerprint(key)).toMatch(/^[0-9a-f]{8}$/);
  });

  it('is "anon" without a key', () => {
    expect(credentialFingerprint(undefined)).toBe('anon');
    expect(credentialFingerprint('')).toBe('anon');
  });
});

describe('cacheKeyFor', () => {
  it('namespaces the URL by fingerprint', () => {
    expect(cacheKeyFor('abc', 'https://api/x')).toBe('abc https://api/x');
    expect(cacheKeyFor('abc', 'https://api/x')).not.toBe(cacheKeyFor('def', 'https://api/x'));
  });
});

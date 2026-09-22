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
  it('is stable for the same key and different across keys', async () => {
    expect(await credentialFingerprint('gsk_abc')).toBe(await credentialFingerprint('gsk_abc'));
    expect(await credentialFingerprint('gsk_abc')).not.toBe(await credentialFingerprint('gsk_abd'));
  });

  it('is a SHA-256 hex digest that never contains the key', async () => {
    const fingerprint = await credentialFingerprint(FIXTURE_KEY);
    expect(fingerprint).not.toContain('gsk_');
    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it('keeps apart two keys the old 32-bit FNV-1a hash put in one bucket', async () => {
    /* A real collision under the previous fingerprint, found by a birthday
       search over key-shaped strings (2^32 buckets fill after about 77k keys).
       Two such keys shared every cache entry. */
    const fnv = (text: string) => {
      let hash = 0x811c9dc5;
      for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
      }
      return hash;
    };
    const [a, b] = ['gsk_07b525d7miv', 'gsk_e7d8d5901f2o'];
    expect(fnv(a)).toBe(fnv(b));
    expect(await credentialFingerprint(a)).not.toBe(await credentialFingerprint(b));
  });

  it('is "anon" without a key', async () => {
    expect(await credentialFingerprint(undefined)).toBe('anon');
    expect(await credentialFingerprint('')).toBe('anon');
  });
});

describe('cacheKeyFor', () => {
  it('namespaces the URL by fingerprint', () => {
    expect(cacheKeyFor('abc', 'https://api/x')).toBe('abc https://api/x');
    expect(cacheKeyFor('abc', 'https://api/x')).not.toBe(cacheKeyFor('def', 'https://api/x'));
  });
});

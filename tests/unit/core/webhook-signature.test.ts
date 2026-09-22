import { describe, it, expect } from 'vitest';
import {
  signWebhookPayload,
  verifyWebhookSignature,
  constructWebhookEvent,
  parseSignatureHeader,
  WebhookSignatureError,
  WEBHOOK_HEADERS,
} from '../../../src/core/webhook-signature';

/* A throwaway HMAC key for the test vectors below; it authenticates nothing. */
const TEST_HMAC_KEY = 'unit-test-hmac-key';
const NOW = 1_800_000_000_000; // fixed clock, ms
const now = () => NOW;

async function signed(body: string, key = TEST_HMAC_KEY, at = Math.floor(NOW / 1000)) {
  const sig = await signWebhookPayload(key, at, body);
  return `t=${at},v1=${sig}`;
}

describe('signWebhookPayload', () => {
  it('matches the API: HMAC-SHA256 hex over `${t}.${body}`', async () => {
    // Computed independently with Node's crypto for the same inputs.
    const { createHmac } = await import('node:crypto');
    const expected = createHmac('sha256', TEST_HMAC_KEY).update('1700000000.{"a":1}').digest('hex');
    expect(await signWebhookPayload(TEST_HMAC_KEY, 1700000000, '{"a":1}')).toBe(expected);
  });
});

describe('parseSignatureHeader', () => {
  it('reads t and v1', () => {
    expect(parseSignatureHeader('t=12,v1=abcd')).toEqual({ timestamp: 12, signatures: ['abcd'] });
  });

  it('accepts several v1 values (key rotation) and ignores unknown keys', () => {
    expect(parseSignatureHeader('t=12,v1=aa,v0=zz,v1=BB').signatures).toEqual(['aa', 'bb']);
  });

  it('rejects a missing header, timestamp or signature', () => {
    expect(() => parseSignatureHeader(null)).toThrow(WebhookSignatureError);
    expect(() => parseSignatureHeader('v1=abcd')).toThrow(/timestamp/);
    expect(() => parseSignatureHeader('t=12')).toThrow(/v1/);
    expect(() => parseSignatureHeader('t=12,v1=not-hex')).toThrow(/v1/);
  });
});

describe('verifyWebhookSignature', () => {
  const body = '{"id":"evt_1","type":"firearm.updated","created_at":"2026-01-01T00:00:00Z","data":{"id":"ak-47"}}';

  it('accepts a genuine delivery', async () => {
    await expect(verifyWebhookSignature(body, await signed(body), TEST_HMAC_KEY, { now })).resolves.toBeUndefined();
  });

  it('rejects a tampered body', async () => {
    const header = await signed(body);
    await expect(verifyWebhookSignature(body.replace('ak-47', 'ak-74'), header, TEST_HMAC_KEY, { now })).rejects.toThrow(/does not match/);
  });

  it('rejects the wrong key', async () => {
    await expect(verifyWebhookSignature(body, await signed(body, 'other-key'), TEST_HMAC_KEY, { now })).rejects.toThrow(/does not match/);
  });

  it('rejects a replay outside the tolerance', async () => {
    const old = Math.floor(NOW / 1000) - 600;
    await expect(verifyWebhookSignature(body, await signed(body, TEST_HMAC_KEY, old), TEST_HMAC_KEY, { now })).rejects.toThrow(/tolerance/);
    await expect(verifyWebhookSignature(body, await signed(body, TEST_HMAC_KEY, old), TEST_HMAC_KEY, { now, toleranceSeconds: 900 })).resolves.toBeUndefined();
  });

  it('rejects an empty key before doing any work', async () => {
    await expect(verifyWebhookSignature(body, await signed(body), '', { now })).rejects.toThrow(/empty/);
  });
});

describe('constructWebhookEvent', () => {
  it('verifies then parses into a typed event', async () => {
    const body = JSON.stringify({ id: 'evt_2', type: 'catalog.resynced', created_at: 'x', data: { reason: 'HASH_VERSION' } });
    const event = await constructWebhookEvent<{ reason: string }>(body, await signed(body), TEST_HMAC_KEY, { now });
    expect(event.type).toBe('catalog.resynced');
    expect(event.data.reason).toBe('HASH_VERSION');
  });

  it('lets an event type it has not heard of through', async () => {
    const body = JSON.stringify({ id: 'evt_3', type: 'firearm.renamed', created_at: 'x', data: {} });
    await expect(constructWebhookEvent(body, await signed(body), TEST_HMAC_KEY, { now })).resolves.toMatchObject({ type: 'firearm.renamed' });
  });

  it('rejects a body that verified but is not an event', async () => {
    const body = '[1,2,3]';
    await expect(constructWebhookEvent(body, await signed(body), TEST_HMAC_KEY, { now })).rejects.toThrow(/not an object|not a webhook event/);
  });

  it('never parses before verifying', async () => {
    await expect(constructWebhookEvent('{not json', 't=1,v1=00', TEST_HMAC_KEY, { now })).rejects.toThrow(/tolerance|match/);
  });
});

describe('WEBHOOK_HEADERS', () => {
  it('names the four delivery headers', () => {
    expect(Object.values(WEBHOOK_HEADERS)).toEqual([
      'X-Webhook-Signature', 'X-Webhook-Id', 'X-Webhook-Event', 'X-Webhook-Delivery',
    ]);
  });
});

describe('without a global WebCrypto (Node 18)', () => {
  it('signs through node:crypto and produces the same digest', async () => {
    const withGlobal = await signWebhookPayload('secret', 1700000000, '{"a":1}');
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true, writable: true });
    try {
      expect((globalThis as { crypto?: unknown }).crypto).toBeUndefined();
      const withoutGlobal = await signWebhookPayload('secret', 1700000000, '{"a":1}');
      expect(withoutGlobal).toBe(withGlobal);
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
    }
  });
});

/**
 * Webhook signature verification for the GunSpec SDK.
 *
 * Every delivery carries `X-Webhook-Signature: t=<unix seconds>,v1=<hex>`,
 * where `v1` is HMAC-SHA256 over `${t}.${rawBody}` with the endpoint's
 * secret. Verifying it proves the body came from GunSpec and was not altered;
 * the timestamp check refuses a captured delivery replayed later.
 *
 * Uses WebCrypto, so it runs unchanged in Node 18+, Workers, Deno and Bun.
 *
 * @module
 */

import { GunSpecError } from './errors/index.js';
import type { WebhookEventType } from '../types/webhook-events.js';

/** The delivery headers a receiver should read. */
export const WEBHOOK_HEADERS = {
  /** `t=<seconds>,v1=<hex>` */
  signature: 'X-Webhook-Signature',
  /** The event id. Retries re-send the same one: dedupe on this. */
  eventId: 'X-Webhook-Id',
  /** The event type, also in the body as `type`. */
  eventType: 'X-Webhook-Event',
  /** This attempt. Different on every retry: quote it, never dedupe on it. */
  deliveryId: 'X-Webhook-Delivery',
} as const;

/** The JSON body of every delivery. */
export interface WebhookEvent<T = unknown> {
  /** `evt_...`, stable across retries. */
  id: string;
  /** One of {@link WebhookEventType}, or `test.ping` from the console's test button. */
  type: WebhookEventType | 'test.ping';
  /** ISO-8601, when the event was emitted. */
  created_at: string;
  /** The record as `GET /v1/...` returns it, or `{ id }` for a deletion. */
  data: T;
}

/** Thrown when a delivery fails verification. Never retry-safe: the body is untrusted. */
export class WebhookSignatureError extends GunSpecError {
  override readonly name: string = 'WebhookSignatureError';
}

/** Options for {@link verifyWebhookSignature}. */
export interface VerifyOptions {
  /** Seconds either side of now a delivery's timestamp may fall. @defaultValue `300` */
  toleranceSeconds?: number;
  /** Override the clock, for tests. */
  now?: () => number;
}

/** Parse `t=...,v1=...`. */
export function parseSignatureHeader(header: string | null | undefined): { timestamp: number; signatures: string[] } {
  if (!header) throw new WebhookSignatureError('Missing X-Webhook-Signature header');
  let timestamp: number | undefined;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === 't') timestamp = Number(value);
    else if (key === 'v1' && /^[0-9a-f]+$/i.test(value)) signatures.push(value.toLowerCase());
  }
  if (timestamp === undefined || !Number.isFinite(timestamp)) {
    throw new WebhookSignatureError('X-Webhook-Signature has no valid timestamp');
  }
  if (signatures.length === 0) throw new WebhookSignatureError('X-Webhook-Signature has no v1 signature');
  return { timestamp, signatures };
}

/**
 * WebCrypto, wherever this runs. Browsers, Workers, Deno, Bun and Node 19+
 * expose it as `globalThis.crypto`; Node 18 has the same implementation but
 * only behind `node:crypto`. The specifier is a variable so a browser bundler
 * never tries to resolve the Node module.
 */
async function subtleCrypto(): Promise<SubtleCrypto> {
  const global = (globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto;
  if (global?.subtle) return global.subtle;
  const specifier = 'node:crypto';
  const mod = (await import(/* @vite-ignore */ specifier)) as { webcrypto?: { subtle?: SubtleCrypto } };
  if (mod.webcrypto?.subtle) return mod.webcrypto.subtle;
  throw new WebhookSignatureError('WebCrypto is not available in this runtime');
}

/** HMAC-SHA256 hex of `${timestamp}.${body}`, exactly as the API computes it. */
export async function signWebhookPayload(secret: string, timestamp: number | string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const subtle = await subtleCrypto();
  const key = await subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compare two hex strings without short-circuiting on the first differing byte. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify a delivery. Resolves when the signature is genuine and the timestamp
 * is inside the tolerance; rejects with {@link WebhookSignatureError} otherwise.
 *
 * @param rawBody - The request body **as received**, before any JSON parsing.
 *   Re-serialising a parsed object changes whitespace and breaks the HMAC.
 * @param signatureHeader - The `X-Webhook-Signature` header value.
 * @param secret - The endpoint secret shown once at creation.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
  options: VerifyOptions = {},
): Promise<void> {
  if (!secret) throw new WebhookSignatureError('Webhook secret is empty');
  const { timestamp, signatures } = parseSignatureHeader(signatureHeader);

  const tolerance = options.toleranceSeconds ?? 300;
  const now = Math.floor((options.now ?? Date.now)() / 1000);
  if (Math.abs(now - timestamp) > tolerance) {
    throw new WebhookSignatureError(`Delivery timestamp is outside the ${tolerance}s tolerance`);
  }

  const expected = await signWebhookPayload(secret, timestamp, rawBody);
  if (!signatures.some((s) => timingSafeEqualHex(s, expected))) {
    throw new WebhookSignatureError('Signature does not match');
  }
}

/**
 * Verify a delivery and parse it into a typed {@link WebhookEvent}.
 *
 * @example
 * ```ts
 * app.post('/hooks/gunspec', async (req, res) => {
 *   const event = await constructWebhookEvent(
 *     await req.text(), req.headers.get('X-Webhook-Signature'), process.env.GUNSPEC_WEBHOOK_SECRET,
 *   );
 *   if (event.type === 'firearm.updated') await mirror.upsert(event.data);
 *   res.status(204).end();
 * });
 * ```
 */
export async function constructWebhookEvent<T = unknown>(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
  options?: VerifyOptions,
): Promise<WebhookEvent<T>> {
  await verifyWebhookSignature(rawBody, signatureHeader, secret, options);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new WebhookSignatureError('Delivery body is not JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) throw new WebhookSignatureError('Delivery body is not an object');
  const event = parsed as Partial<WebhookEvent<T>>;
  if (typeof event.id !== 'string' || typeof event.type !== 'string' || !('data' in event)) {
    throw new WebhookSignatureError('Delivery body is not a webhook event');
  }
  /* An event type this SDK has not heard of is let through: the versioning
     promise is that new events arrive without a new API version, so a
     receiver on an older SDK must still see them. `isWebhookEventType` is the
     narrowing a caller reaches for once it wants to branch. */
  return event as WebhookEvent<T>;
}

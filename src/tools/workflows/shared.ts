/**
 * What every workflow shares: optional steps that degrade into `gaps`, the
 * `detail` switch, name resolution that never guesses, and offer links.
 *
 * @module
 */

import type { GunSpec } from '../../client';
import { APIError, PermissionError } from '../../core/errors';
import type { PublicOffer, ResolveResult } from '../../types';
import type { JsonSchemaProperty } from '../types';

/** Something the workflow could not include, and why. */
export interface WorkflowGap {
  /** The SDK method that did not contribute, e.g. `calibers.getFamily`. */
  step: string;
  /** The API's `error.reason`, e.g. `PLAN_REQUIRED`. */
  reason: string;
  message: string;
  /** Present when the plan was the problem. */
  requiredTier?: string;
}

/** How much of each record to return. `summary` is the token-saving default. */
export type Detail = 'summary' | 'full';

export const DETAIL: JsonSchemaProperty = {
  type: 'string',
  description: 'The level of detail to return. `summary` (the default) keeps the response small. `full` adds descriptions and longer lists.',
  enum: ['summary', 'full'],
  default: 'summary',
};

/**
 * Run a step the answer can stand without. An API refusal - a plan gate, a
 * missing record - becomes a gap; anything else is a real failure and throws.
 */
export async function optionalStep<T>(step: string, gaps: WorkflowGap[], run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    const requiredTier = error instanceof PermissionError ? error.requiredTier : undefined;
    gaps.push({ step, reason: error.reason, message: error.message, ...(requiredTier ? { requiredTier } : {}) });
    return null;
  }
}

/**
 * A name the catalog could not settle on one record. Returned instead of the
 * answer: picking the first candidate would describe a firearm the user may
 * not have meant, with every figure attributed to it.
 */
export interface Unresolved {
  resolved: false;
  query: string;
  status: string;
  candidates: Array<{ id: string; name: string; manufacturer: string | null }>;
}

export function unresolved(result: ResolveResult, query: string): Unresolved {
  return {
    resolved: false,
    query,
    status: result.status,
    candidates: (result.alternatives ?? []).slice(0, 5).map((a) => ({
      id: a.firearmId,
      name: a.name,
      manufacturer: a.manufacturerName ?? null,
    })),
  };
}

/** Offers with the tracked outbound link a host should use, trimmed to what a reader needs. */
export function offerSummaries(client: GunSpec, offers: readonly PublicOffer[]) {
  return offers.map((o) => ({
    vendor: o.vendor.name,
    priceCents: o.priceCents,
    currency: o.currency,
    inStock: o.inStock,
    region: o.region,
    href: o.clickId ? client.vendor.clickUrl(o.clickId) : o.url,
  }));
}

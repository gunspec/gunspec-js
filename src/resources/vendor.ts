/**
 * Vendor (seller) resource for the GunSpec SDK.
 *
 * Wraps `/v1/vendor/*` and the outbound click route. A seller holds an
 * Enterprise plan and names one of their ordinary keys in Profile > Seller;
 * that mapping is the whole vendor scope, so there is no separate credential
 * to configure here. A key no shop names answers 403 `KEY_NOT_LINKED_TO_SHOP`.
 *
 * A feed reads before it writes: `shops()` tells a script which ids it can
 * act for, `listOffers()` returns what the API holds, and `updateOffer()`
 * changes one field without resending the rest.
 *
 * @module
 */

import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  ListVendorOffersParams,
  PushOffersInput,
  PushOffersResult,
  UpdateOfferInput,
  VendorOffer,
  VendorScope,
  VendorShop,
} from '../types';

export class VendorResource {
  constructor(private readonly client: HttpClient) {}

  /** The shops this key may act for. A script learns its shop ids here. */
  async shops(): Promise<APIResponse<VendorShop[]>> {
    return this.client.get<VendorShop[]>('/v1/vendor/shops');
  }

  /** Your listings as the API holds them, `stockQty` and click counts included. */
  async listOffers(params?: ListVendorOffersParams): Promise<PaginatedResponse<VendorOffer>> {
    return this.client.getPaginated<VendorOffer>('/v1/vendor/offers', params);
  }

  /**
   * Upsert up to 500 listings keyed by your own SKU. Ids we do not hold come
   * back as `unmatched` rather than failing the batch; a bad row (a string
   * price, a float) is a 400 with `details` naming it.
   */
  async pushOffers(input: PushOffersInput, scope?: VendorScope): Promise<APIResponse<PushOffersResult>> {
    return this.client.put<PushOffersResult>('/v1/vendor/offers', input, scope);
  }

  /** Change one listing. Absent fields are unchanged. */
  async updateOffer(sku: string, input: UpdateOfferInput, scope?: VendorScope): Promise<APIResponse<{ sku: string }>> {
    return this.client.patch<{ sku: string }>(`/v1/vendor/offers/${encodeURIComponent(sku)}`, input, scope);
  }

  /** Withdraw one listing. */
  async deleteOffer(sku: string, scope?: VendorScope): Promise<APIResponse<{ removed: boolean }>> {
    return this.client.delete<{ removed: boolean }>(`/v1/vendor/offers/${encodeURIComponent(sku)}`, scope);
  }

  /**
   * The tracked outbound link for an offer's `clickId`. Render this as the
   * href: the API counts the visit and 302s to the shop, so the seller can
   * check our figure against their own analytics.
   */
  clickUrl(clickId: string, locale?: 'en' | 'de'): string {
    return this.client.urlFor(`/v1/out/${encodeURIComponent(clickId)}`, locale ? { l: locale } : undefined);
  }

  /**
   * Follow a click server-side and return the shop URL it lands on. The API
   * counts this as a visit exactly as a browser's would; use it for a link
   * checker, not for rendering. `null` when the runtime hides cross-origin
   * redirects (browsers do).
   */
  async resolveClick(clickId: string): Promise<string | null> {
    return this.client.resolveRedirect(`/v1/out/${encodeURIComponent(clickId)}`);
  }
}

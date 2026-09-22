// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Seller (vendor) types
// ---------------------------------------------------------------------------
// Mirrors the `Seller` tag in `apps/api/src/openapi/paths/`. There is no such
// thing as a vendor key: a shop names an ordinary Enterprise key in
// Profile > Seller, and that mapping is the entire vendor scope.
// ---------------------------------------------------------------------------

import type { PaginationParams } from './api';
import type { OfferStatus, OfferTargetKind } from './vocabulary';

/** A shop the calling key may act for (`GET /v1/vendor/shops`). */
export interface VendorShop {
  id: string;
  name: string;
  website: string | null;
  /** ISO 4217 default for the shop's listings. */
  currency: string | null;
  approved: boolean;
}

/** One of your own listings as the API holds it, private fields included. */
export interface VendorOffer {
  sku: string;
  targetKind: OfferTargetKind;
  targetId: string;
  priceCents: number;
  currency: string;
  url: string;
  inStock: boolean;
  /** Private to the shop: 0 out of stock, null not tracked. */
  stockQty: number | null;
  /** A console row is written as a draft; publishing is a second action. */
  status: OfferStatus;
  /** `feed` (30-day freshness window) or `console` (90-day). */
  source: string;
  /** Outbound clicks recorded through `/v1/out/{clickId}`. */
  clicks: number;
  updatedAt: string;
}

/** Parameters for `GET /v1/vendor/offers`. */
export interface ListVendorOffersParams extends PaginationParams {
  /** Which shop to act for. Required only when one key is named by more than one shop. */
  vendor?: string;
  kind?: OfferTargetKind;
  status?: OfferStatus;
  /** Match on your SKU or the product name. */
  q?: string;
}

/** Names exactly one of `attachment_id` or `firearm_id`. */
export interface OfferInput {
  /** Your own SKU. The key every later update and withdrawal uses. */
  sku: string;
  attachment_id?: string;
  firearm_id?: string;
  /** Integer minor units. A float is refused at the boundary. */
  price_cents: number;
  /** ISO 4217. */
  currency: string;
  url: string;
  in_stock?: boolean;
  /** ISO 3166-1 alpha-2, or null for worldwide. */
  region?: string | null;
}

/** Body for `PUT /v1/vendor/offers`: up to 500 rows keyed by your SKU. */
export interface PushOffersInput {
  offers: OfferInput[];
}

/** Result of a push. Unknown ids are reported here rather than failing the batch. */
export interface PushOffersResult {
  written: number;
  unmatched: Array<{ sku: string; targetKind: OfferTargetKind; targetId: string }>;
}

/**
 * Body for `PATCH /v1/vendor/offers/{sku}`. Every field optional, absent
 * meaning unchanged. Send `stock_qty` (the count) or `in_stock` (the flag),
 * never both: a row carrying a quantity derives its flag from it.
 */
export interface UpdateOfferInput {
  price_cents?: number;
  currency?: string;
  url?: string;
  stock_qty?: number;
  in_stock?: boolean;
  region?: string | null;
  status?: OfferStatus;
}

/** `vendor=` selector shared by the seller write routes. */
export interface VendorScope {
  /** Which shop to act for. Required only when one key is named by more than one shop. */
  vendor?: string;
}

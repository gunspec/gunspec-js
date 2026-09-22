// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Attachment compatibility types
// ---------------------------------------------------------------------------
// Mirrors `apps/api/src/openapi/paths/compatibility.ts`. What fits a firearm
// is computed from mount interfaces, never from names; the shapes here carry
// the evidence (`source`, `confidence`, `via`) so a caller can show why.
// ---------------------------------------------------------------------------

import type { Provenance } from './models';
import type { InlineMediaItem } from './media';
import type { PaginationParams } from './api';
import type { AttachmentStatus, FitSource, FitType, InterfaceSource } from './vocabulary';

export type { AttachmentStatus, FitSource, FitType, InterfaceSource };

/** A mount standard the vocabulary knows: `thread:1/2x28`, `mag:stanag`. */
export interface InterfaceStandard {
  /** Kind-prefixed id, never renamed. */
  id: string;
  /** `thread`, `rail`, `mag`, `stock`, `optic`, ... */
  kind: string;
  name: string;
  /** Other spellings that resolve to this id. */
  aliases: string[];
  notes?: string | null;
}

/** One position on a firearm and the standard it exposes there. */
export interface FirearmInterface {
  /** `muzzle`, `top-rail`, `magwell`, ... */
  position: string;
  standardId: string;
  name: string;
  kind: string;
  source: InterfaceSource;
  /** 0 to 1. Inferred and convention rows never exceed 0.6. */
  confidence: number;
  /** The parent or platform id the row was inherited from. */
  inheritedFrom?: string | null;
  notes?: string | null;
}

/** A family a firearm belongs to, e.g. `ak-100`. */
export interface PlatformSummary {
  id: string;
  name: string;
}

/** `GET /v1/platforms` row. */
export interface Platform extends PlatformSummary {
  description?: string | null;
  memberCount: number;
}

/** `GET /v1/platforms/{id}`. */
export interface PlatformDetail extends PlatformSummary {
  description?: string | null;
  interfaces: Array<Pick<FirearmInterface, 'position' | 'standardId' | 'name' | 'kind' | 'confidence' | 'notes'>>;
  members: Array<{ id: string; name: string }>;
}

/** `GET /v1/firearms/{id}/interfaces`. */
export interface FirearmInterfaces {
  firearm: { id: string; name: string };
  platforms: PlatformSummary[];
  interfaces: FirearmInterface[];
}

/** An attachment as it appears in lists and fit results. */
export interface Attachment {
  id: string;
  name: string;
  /** `suppressor`, `optic`, `magazine`, `grip`, ... */
  category: string;
  manufacturer: { id: string; name: string } | null;
  modelNumber?: string | null;
  weightG?: number | null;
  lengthMm?: number | null;
  capacity?: number | null;
  boreDiameterMm?: number | null;
  requiresPosition?: string | null;
  /** A factory part: the firearm's figures already include it. */
  isFactoryPart: boolean;
  factoryFor?: string | null;
  /** Editorial game modifiers, same status as `game_*` on a firearm. */
  statMods?: Record<string, number>;
  specDeltas?: Record<string, number | null>;
  imageUrl?: string | null;
  status: AttachmentStatus;
  dataConfidence?: number | null;
  /** Interface standards this part adds once fitted (adapters, rail sections). */
  provides: string[];
  /** Sources, confidence and verification state. */
  provenance?: Provenance;
  updatedAt: string;
  /** Content hash; equal versions mean equal data. */
  version: string | null;
}

/** `GET /v1/attachments/{id}`. */
export interface AttachmentDetail extends Omit<Attachment, 'provides'> {
  description?: string | null;
  specs?: Record<string, unknown>;
  sources?: string[];
  sourceUrl?: string | null;
  yearIntroduced?: number | null;
  /** Any-of within a group, all-of across groups. Empty means universal. */
  requires: Array<Array<{ id: string; name: string; kind: string }>>;
  provides: Array<{ id: string; name: string; kind: string }>;
  caliberRatings: Array<{
    caliberId: string;
    caliberName: string | null;
    minBarrelLengthMm: number | null;
    fullAutoRated: boolean;
    notes: string | null;
  }>;
  curatedFits: number;
  createdAt: string;
}

/** How a fit was reached. */
export interface FitVia {
  position: string;
  standardId: string;
  source: InterfaceSource;
  adapterId: string | null;
}

/** An attachment with its fit verdict against one firearm. */
export interface AttachmentFit extends Attachment {
  fits: boolean;
  fitType: FitType | null;
  /**
   * The weakest evidence behind the fit. `curated` is a person's verdict,
   * `universal` needs no interface at all, the rest name the least trustworthy
   * interface row the fit passed through; treat `inferred` as unverified.
   */
  source: FitSource | null;
  via: FitVia[];
  adapter: { id: string; name: string } | null;
  /** Minimum confidence along the chain that produced this fit. */
  confidence: number;
  reason: string;
  /** Present with `include=all` on an item that does not fit. */
  blockedBy?: string | null;
}

/** `GET /v1/firearms/{id}/attachments`. */
export interface FirearmAttachments extends FirearmInterfaces {
  groups: Array<{ category: string; items: AttachmentFit[] }>;
  counts: Record<string, number>;
  total: number;
  /** With `with_offers=true`, live offers keyed by attachment id; null when not requested. */
  offers: Record<string, PublicOffer[]> | null;
}

/** A firearm an attachment fits (`GET /v1/attachments/{id}/firearms`). */
export interface AttachmentFirearmFit {
  id: string;
  name: string;
  fitType: FitType | null;
  /** The weakest evidence behind the fit; see {@link AttachmentFit.source}. */
  source: FitSource | null;
  confidence: number;
  reason: string;
  via: FitVia[];
  adapter: { id: string; name: string } | null;
  manufacturer: { id: string; name: string } | null;
  category: string | null;
  images: InlineMediaItem[];
  svgLineArtUrl: string | null;
  yearIntroduced?: number;
}

/** A firearm exposing a standard (`GET /v1/interfaces/{id}/firearms`). */
export interface InterfaceFirearm {
  id: string;
  name: string;
  position: string;
  source: InterfaceSource;
  confidence: number;
  manufacturer: { id: string; name: string } | null;
  category: string | null;
  images: InlineMediaItem[];
  svgLineArtUrl: string | null;
  yearIntroduced?: number;
}

/** Parameters for `GET /v1/attachments`. */
export interface ListAttachmentsParams extends PaginationParams {
  category?: string;
  manufacturer?: string;
  /** Only attachments that fit this firearm. Studio: this is the fit engine. */
  fits?: string;
  /** Only attachments requiring this interface standard. */
  requires?: string;
  /** Substring match on name. */
  q?: string;
  /** Only factory parts (`true`) or only aftermarket (`false`). */
  factory?: boolean;
  status?: AttachmentStatus;
  /** Restrict to one seller; `me` resolves to your key's vendor. */
  vendor?: string;
  /** Drop anything that seller does not stock. Fails closed without a vendor. */
  only_offered?: boolean;
}

/** Parameters for `GET /v1/firearms/{id}/attachments`. */
export interface FirearmAttachmentsParams {
  category?: string;
  manufacturer?: string;
  /** `compatible` (default) or `all` to include blocked candidates. */
  include?: 'compatible' | 'all';
  /** Hide fits computed through interfaces below this confidence. */
  min_confidence?: number;
  vendor?: string;
  only_offered?: boolean;
  /** Attach each item's live offers under `offers`, keyed by attachment id. */
  with_offers?: boolean;
}

/** Parameters for `GET /v1/interfaces`. */
export interface ListInterfacesParams {
  /** One kind only. */
  kind?: string;
}

/** A seller's public listing for a firearm or attachment. */
export interface PublicOffer {
  vendor: {
    id: string;
    name: string;
    website: string | null;
    logoUrl: string | null;
    /**
     * The domain the shop has proved it controls, by a DNS record or a file on
     * the site, re-checked daily. Null when it has not, which is not a sign the
     * shop is untrustworthy: most have simply not done it yet.
     */
    verifiedDomain?: string | null;
  };
  /** The seller's own SKU. */
  sku: string;
  /** Integer minor units; format with `Intl.NumberFormat`, never divide first. */
  priceCents: number;
  /** ISO 4217. */
  currency: string;
  url: string;
  inStock: boolean;
  /** Opaque token for `GET /v1/out/{clickId}`; link through it so the seller sees the visit. */
  clickId: string | null;
  region: string | null;
  updatedAt: string;
}

/** Parameters for `GET /v1/{firearms|attachments}/{id}/offers`. */
export interface OffersParams {
  /** ISO 3166-1 alpha-2; hides sellers who do not ship there. A display convenience, not a compliance check. */
  region?: string;
}

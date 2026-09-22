// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: firearm relations (images, users)
// ---------------------------------------------------------------------------
import type { ImageType, MediaKind } from '../vocabulary';

// ── Firearm Images ─────────────────────────────────────────────────────────

/**
 * An image associated with a firearm.
 */
export interface FirearmImage {
  /** Auto-increment integer ID. */
  readonly id: number;
  /** Firearm slug (FK to {@link Firearm.id}). */
  firearmId: string;
  /** Image URL. */
  url: string;
  /**
   * The older spelling of `kind`: `svg` is `silhouette`, `3d_model` is `model`.
   * @deprecated Read `kind` instead; `type` will be removed under the next breaking notice.
   */
  type?: ImageType | null;
  /** Image source attribution. */
  source?: string | null;
  /** Image license. */
  license?: string | null;
  /** What kind of asset this is. */
  kind?: MediaKind | null;
  /** Where the bytes live (`r2`, `external` ...). */
  storage?: string | null;
  /** Credited author. */
  author?: string | null;
  /** The page the image was taken from. */
  sourceUrl?: string | null;
  /** Alternative text. */
  alt?: string | null;
  /** Pixel width, where known. */
  width?: number | null;
  /** Pixel height, where known. */
  height?: number | null;
  /** Display order within the firearm's gallery. */
  sortOrder?: number;
}

// ── Firearm Users (adopters) ───────────────────────────────────────────────

/**
 * A military, law-enforcement, or other institutional user of a firearm.
 */
export interface FirearmUser {
  /** Auto-increment integer ID. */
  readonly id: number;
  /** Firearm slug (FK to {@link Firearm.id}). */
  firearmId: string;
  /** User / organisation name (e.g. `"U.S. Army"`). */
  userName: string;
  /** User type (e.g. `"military"`, `"law_enforcement"`). */
  userType?: string | null;
  /** ISO 3166-1 alpha-2 country code. */
  countryCode?: string | null;
  /** Year the firearm was adopted. */
  adoptedYear?: number | null;
  /** Service designation (e.g. `"M9"`, `"P226"`). */
  designation?: string | null;
}

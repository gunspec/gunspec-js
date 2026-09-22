// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Request parameters: firearms
// ---------------------------------------------------------------------------
import type { PaginationParams } from './shared';

// ── Firearms ───────────────────────────────────────────────────────────────

/**
 * Parameters for `GET /v1/firearms`.
 *
 * @example
 * ```ts
 * const params: ListFirearmsParams = {
 *   manufacturer: 'glock',
 *   category: 'pistol',
 *   sort: 'name',
 *   page: 1,
 *   per_page: 20,
 * };
 * ```
 */
export interface ListFirearmsParams extends PaginationParams {
  /** Filter by manufacturer slug. */
  manufacturer?: string;
  /** Filter by caliber slug (matched via junction table). */
  caliber?: string;
  /** Filter by category slug. */
  category?: string;
  /** Filter by action type slug. */
  action_type?: string;
  /** Filter by country of origin ISO code. */
  country_of_origin?: string;
  /** Minimum year introduced (inclusive). */
  year_introduced_min?: number;
  /** Maximum year introduced (inclusive). */
  year_introduced_max?: number;
  /** Minimum empty weight in grams. */
  weight_min?: number;
  /** Maximum empty weight in grams. */
  weight_max?: number;
  /** Minimum barrel length in mm. */
  barrel_length_min?: number;
  /** Filter by production status. */
  status?: 'in_production' | 'discontinued' | 'prototype';
  /** Filter for firearms with/without a 3-D model. */
  has_3d_model?: 'true' | 'false';
  /** Comma-separated list of fields to include in the response (sparse fieldset). */
  fields?: string;
  /**
   * Sort column.
   * @defaultValue `"name"`
   */
  sort?: 'name' | 'weight' | 'year' | 'caliber' | 'created_at' | 'favorites';
}

/**
 * Parameters for `GET /v1/firearms/search`.
 */
export interface SearchFirearmsParams extends PaginationParams {
  /** Full-text search query (1-200 characters). */
  q: string;
}

/**
 * Parameters for `GET /v1/firearms/compare`.
 */
export interface CompareFirearmsParams {
  /**
   * Comma-separated firearm slugs to compare (maximum 5).
   *
   * @example `"glock-g17,beretta-92fs,sig-sauer-p226"`
   */
  ids: string;
}

/**
 * Parameters for `GET /v1/firearms/:id/game/meta`.
 */
export interface GameMetaParams {
  /** Filter by computed archetype. */
  archetype?: 'sniper' | 'assault' | 'tank' | 'glass-cannon' | 'all-rounder' | 'support' | 'stealth' | 'speedster';
}

/**
 * Parameters for `GET /v1/firearms/random`.
 */
export interface RandomFirearmParams {
  /** Filter by category slug. */
  category?: string;
  /** Filter by country of origin ISO code. */
  country?: string;
}

/**
 * Parameters for `GET /v1/firearms/top`.
 *
 * @example
 * ```ts
 * const params: TopFirearmsParams = { stat: 'lightest', category: 'pistol', limit: 5 };
 * ```
 */
export interface TopFirearmsParams {
  /** The stat to rank by. */
  stat: 'lightest' | 'heaviest' | 'longest-range' | 'highest-rof' | 'most-compact' | 'highest-capacity' | 'most-powerful';
  /** Filter by category slug. */
  category?: string;
  /**
   * Maximum number of results (1-25).
   * @defaultValue `10`
   */
  limit?: number;
}

/**
 * Parameters for `GET /v1/firearms/head-to-head`.
 */
export interface HeadToHeadParams {
  /** Slug of firearm A. */
  a: string;
  /** Slug of firearm B. */
  b: string;
}

/**
 * Parameters for `GET /v1/firearms/by-feature`.
 */
export interface ByFeatureParams extends PaginationParams {
  /** Feature name to search for (matched via JSON LIKE). */
  feature: string;
  /** Optional category filter. */
  category?: string;
}

/**
 * Parameters for `GET /v1/firearms/by-action`.
 */
export interface ByActionParams extends PaginationParams {
  /** Action type to filter by (exact match). */
  action: string;
}

/**
 * Parameters for `GET /v1/firearms/by-material`.
 */
export interface ByMaterialParams extends PaginationParams {
  /** Material name to search for (substring match). */
  material: string;
  /** Which firearm component to search. */
  component: 'frame' | 'barrel' | 'stock' | 'slide';
}

/**
 * Parameters for `GET /v1/firearms/by-designer`.
 */
export interface ByDesignerParams extends PaginationParams {
  /** Designer name to search for (substring match). */
  designer: string;
}

/**
 * Parameters for `GET /v1/firearms/power-rating`.
 */
export interface PowerRatingParams extends PaginationParams {
  /** Optional category filter. */
  category?: string;
}

/**
 * Parameters for `GET /v1/firearms/timeline`.
 */
export interface TimelineParams {
  /**
   * Page number (1-based).
   * @defaultValue `1`
   */
  page?: number;
  /**
   * Items per page (1-100).
   * @defaultValue `50`
   */
  per_page?: number;
  /** Sort column. */
  sort?: string;
  /**
   * Sort direction.
   * @defaultValue `"asc"`
   */
  order?: 'asc' | 'desc';
  /** Earliest year to include (inclusive). */
  from?: number;
  /** Latest year to include (inclusive). */
  to?: number;
  /** Optional category filter. */
  category?: string;
}

/**
 * Parameters for `GET /v1/firearms/by-conflict`.
 */
export interface ByConflictParams extends PaginationParams {
  /** Conflict name to search for (substring match). */
  conflict: string;
}

/**
 * Parameters for `GET /v1/firearms/:id/calculate`.
 */
export interface CalculateBallisticsParams {
  /** Ammunition slug to calculate with. */
  ammo_id: string;
}

/**
 * Parameters for `GET /v1/firearms/:id/load`.
 */
export interface LoadFirearmParams {
  /**
   * Ammunition slug.
   * If omitted, uses the firearm's default ammo or the most common ammo
   * for the primary caliber.
   */
  ammo_id?: string;
}

// ── Silhouette ────────────────────────────────────────────────────────────

/**
 * Parameters for `GET /v1/firearms/:id/silhouette`.
 */
export interface SilhouetteParams {
  /** Output format: `"raw"` (the SVG file; `"svg"` means the same), `"datauri"` (base64), or `"json"` (the SVG source). */
  format?: 'raw' | 'svg' | 'datauri' | 'json';
  /** Stroke width in pixels. */
  stroke_width?: number;
  /** Stroke color (CSS color string). */
  stroke_color?: string;
}

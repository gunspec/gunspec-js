// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Request parameters: stats
// ---------------------------------------------------------------------------
import type { PaginationParams } from './shared';

// ── Stats ──────────────────────────────────────────────────────────────────

/**
 * Parameters for `GET /v1/stats/popular-calibers`.
 */
export interface PopularCalibersParams {
  /**
   * Maximum number of results (1-100).
   * @defaultValue `20`
   */
  limit?: number;
}

/**
 * Parameters for `GET /v1/stats/prolific-manufacturers`.
 */
export interface ProlificManufacturersParams {
  /**
   * Maximum number of results (1-100).
   * @defaultValue `20`
   */
  limit?: number;
  /** Optional category filter. */
  category?: string;
}

/**
 * Parameters for `GET /v1/stats/by-era`.
 *
 * @example
 * ```ts
 * const params: ByEraParams = { decade: '1990s' };
 * ```
 */
export interface ByEraParams {
  /** Decade string in format `"1990s"`, `"2000s"`, etc. */
  decade: string;
}

/**
 * Parameters for `GET /v1/stats/adoption/country`.
 */
export interface AdoptionByCountryParams {
  /** ISO 3166-1 country code. */
  code: string;
}

/**
 * Parameters for `GET /v1/stats/adoption/type`.
 */
export interface AdoptionByTypeParams {
  /** User type to query. */
  type: 'military' | 'law_enforcement' | 'civilian' | 'paramilitary' | 'special_forces' | 'private_security' | 'training';
}

/**
 * Parameters for `GET /v1/stats/action-types`.
 */
export interface ActionTypesParams {
  /** Optional category filter. */
  category?: string;
}

/**
 * Parameters for `GET /v1/stats/feature-frequency`.
 */
export interface FeatureFrequencyParams {
  /** Optional category filter. */
  category?: string;
  /**
   * Maximum number of results (1-100).
   * @defaultValue `50`
   */
  limit?: number;
}

/**
 * Parameters for `GET /v1/stats/caliber-popularity-by-era`.
 */
export interface CaliberPopularityByEraParams {
  /** Starting decade (inclusive, e.g. `"1950s"`). */
  from_decade?: string;
  /** Ending decade (inclusive, e.g. `"2020s"`). */
  to_decade?: string;
}

// ── Data Quality ───────────────────────────────────────────────────────────

/**
 * Parameters for `GET /v1/data/confidence`.
 */
export interface ConfidenceParams extends PaginationParams {
  /**
   * Return firearms with confidence below this threshold (0.0-1.0).
   * @defaultValue `0.5`
   */
  below?: number;
}

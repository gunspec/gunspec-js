// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Request parameters: catalog
// ---------------------------------------------------------------------------
import type { PaginationParams } from './shared';

// ── Manufacturers ──────────────────────────────────────────────────────────

/**
 * Parameters for `GET /v1/manufacturers`.
 */
export interface ListManufacturersParams extends PaginationParams {
  /** Filter by country ISO code. */
  country?: string;
}

// ── Calibers ───────────────────────────────────────────────────────────────

/**
 * Parameters for `GET /v1/calibers`.
 */
export interface ListCalibersParams extends PaginationParams {
  /** Search by name, alias or slug (e.g. `".308"`). */
  q?: string;
  /** Filter by cartridge type (e.g. `"centerfire_rifle"`). */
  cartridge_type?: string;
  /** Filter by primer type (e.g. `"Boxer"`). */
  primer_type?: string;
}

/**
 * Parameters for `GET /v1/calibers/compare`.
 */
export interface CompareCalibersParams {
  /**
   * Comma-separated caliber slugs to compare (maximum 5).
   *
   * @example `"9x19mm-parabellum,45-acp,40-s-w"`
   */
  ids: string;
}

/**
 * Parameters for `GET /v1/calibers/:id/ballistics`.
 */
export interface CaliberBallisticsParams {
  /**
   * Distance in metres for the ballistic calculation (1-5000).
   * @defaultValue `100`
   */
  distance?: number;
}

// ── Ammunition ─────────────────────────────────────────────────────────────

/**
 * Parameters for `GET /v1/ammunition`.
 */
export interface ListAmmunitionParams extends PaginationParams {
  /** Filter by caliber slug. */
  caliber_id?: string;
  /** Filter by bullet type (e.g. `"FMJ"`, `"JHP"`). */
  bullet_type?: string;
  /** Filter by common status (`0` = uncommon, `1` = common). */
  is_common?: 0 | 1;
}

/**
 * Parameters for `GET /v1/ammunition/:id/ballistics`.
 */
export interface AmmunitionBallisticsParams {
  /**
   * Barrel length in mm to use for the calculation (50-2000).
   * If omitted, uses the ammunition's reference barrel length.
   */
  barrel_length_mm?: number;
  /**
   * Comma-separated distances in metres for the trajectory table.
   * If omitted, uses the default set: 0, 50, 100, 200, 300, 400, 500, 600, 800, 1000.
   *
   * @example `"0,100,200,300,500"`
   */
  distances?: string;
}

// ── Countries ──────────────────────────────────────────────────────────────

/**
 * Path parameter for `GET /v1/countries/:code/arsenal`.
 */
export interface CountryCodeParam {
  /** ISO 3166-1 country code. */
  code: string;
}

// ── Conflicts ──────────────────────────────────────────────────────────────

/**
 * Parameters for `GET /v1/conflicts`.
 */
export interface ConflictNameQuery {
  /** Optional conflict name filter. */
  name?: string;
}

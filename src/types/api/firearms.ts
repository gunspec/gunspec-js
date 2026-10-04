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

/** The surface a march crosses; each has a Soule and Goldman (1972) terrain factor. */
export type LoadCarriageTerrain = 'paved' | 'dirt_road' | 'light_brush' | 'heavy_brush' | 'swampy_bog' | 'loose_sand';

/** Load-carriage equations: `lcda` (Looney et al. 2022) or `pandolf` (1977). */
export type LoadCarriageModel = 'lcda' | 'pandolf';

/**
 * Parameters for `GET /v1/firearms/load-carriage`.
 *
 * Every parameter but `ids` has a default; the answer's `march.defaulted`
 * names the ones it assumed.
 */
export interface LoadCarriageParams {
  /**
   * Comma-separated firearm slugs (maximum 5).
   *
   * @example `"hk416,fn-scar-l"`
   */
  ids: string;
  /** Soldier body mass in kg, 40 to 160. Default 80. */
  body_mass_kg?: number;
  /** Body fat as a percentage of body mass, 3 to 50. Default 15. */
  body_fat_pct?: number;
  /** Everything else carried, in kg: armour, pack, water. 0 to 120. Default 0. */
  kit_kg?: number;
  /** Full magazines carried in total, the one in the firearm included, 0 to 20. 0 carries it unloaded. Default 1. */
  magazines?: number;
  /**
   * Comma-separated attachment slugs (maximum 10), added to every firearm by their recorded weight.
   *
   * @example `"aimpoint-compm5"`
   */
  attachments?: string;
  /** Marching speed in km/h, 1 to 10. Default 4.8. */
  speed_kmh?: number;
  /** Slope as a percentage, rise over run, -30 to 30: negative is downhill. Default 0. */
  grade_pct?: number;
  /** Surface. Default `paved`. */
  terrain?: LoadCarriageTerrain;
  /** March distance in km, 0.1 to 200. Default 20. */
  distance_km?: number;
  /** Equation. Default `lcda`; `pandolf` refuses a downhill grade. */
  model?: LoadCarriageModel;
}

/** SAAMI's classes of firearm, each with its own powder gas velocity factor. */
export type RecoilGasClass = 'rifle' | 'shotgun' | 'shotgun_long_barrel' | 'handgun';

/**
 * Parameters for `GET /v1/firearms/recoil`.
 *
 * Without `powder_charge_g` the answer counts the bullet alone and every
 * figure is a lower bound.
 */
export interface RecoilParams {
  /**
   * Comma-separated firearm slugs (maximum 5).
   *
   * @example `"hk416,m4-carbine"`
   */
  ids: string;
  /**
   * The load every firearm fires. Default: each fires the load its ballistic profile uses.
   *
   * @example `"m855"`
   */
  ammo_id?: string;
  /** Which recorded weight recoils. Default `loaded`, falling back to the empty weight where none is recorded. */
  mass?: 'loaded' | 'empty';
  /** The load's powder charge in grams, up to 100. Needs `ammo_id`. */
  powder_charge_g?: number;
  /** The SAAMI class whose gas velocity factor applies. Default: read from each firearm's category. */
  gas_class?: RecoilGasClass;
}

/** Parameters for `GET /v1/firearms/point-blank`. */
export interface PointBlankParams {
  /**
   * Comma-separated firearm slugs (maximum 5).
   *
   * @example `"hk416,fn-scar-h"`
   */
  ids: string;
  /** The load every firearm fires. Default: each fires the load its ballistic profile uses. */
  ammo_id?: string;
  /** Target diameter in mm, 20 to 2000. Default 200. */
  target_mm?: number;
  /** Sight height above the bore in mm, 0 to 150. Default: the height assumed for the firearm's category. */
  sight_height_mm?: number;
}

/** Parameters for `GET /v1/firearms/ammo-load`. */
export interface AmmoLoadParams {
  /**
   * Comma-separated firearm slugs (maximum 5).
   *
   * @example `"hk416,ak-74"`
   */
  ids: string;
  /** A load whose bullet the estimate uses, for the firearms that fire its cartridge. */
  ammo_id?: string;
  /** A weight of full magazines to fill, in kg, 0.1 to 100. Default 5. */
  budget_kg?: number;
  /** Full magazines in the estimated basic load, 0 to 50. Default 7. */
  magazines?: number;
  /** Rounds in the estimated basic load, 1 to 10000. Default: `magazines` times the capacity. */
  rounds?: number;
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

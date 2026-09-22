// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: shared
// ---------------------------------------------------------------------------
import type { BalanceDeviation, BalanceEntry, RoleRosterItem } from './game';

// ── Pagination ─────────────────────────────────────────────────────────────

/**
 * Standard paginated API response wrapper.
 *
 * All list endpoints return this shape.
 *
 * @typeParam T - The type of items in the `data` array.
 *
 * @example
 * ```ts
 * const response: PaginatedResponse<FirearmListItem> = {
 *   success: true,
 *   data: [{ id: 'glock-g17', name: 'Glock G17', ... }],
 *   pagination: { page: 1, per_page: 20, total: 150, total_pages: 8 },
 * };
 * ```
 */
export interface PaginatedResponse<T> {
  /** Whether the request was successful. */
  success: true;
  /** Array of result items. */
  data: T[];
  /** Pagination metadata. */
  pagination: {
    /** Current page number (1-based). */
    page: number;
    /** Items per page. */
    per_page: number;
    /** Total number of matching items. */
    total: number;
    /** Total number of pages. */
    total_pages: number;
  };
}

/**
 * Standard single-item API response wrapper.
 *
 * Detail endpoints return this shape.
 *
 * @typeParam T - The type of the `data` property.
 */
export interface SuccessResponse<T> {
  /** Whether the request was successful. */
  success: true;
  /** The response data. */
  data: T;
}

// ---------------------------------------------------------------------------
// Additional types referenced by resources
// ---------------------------------------------------------------------------

/**
 * A country's firearm arsenal - military and law enforcement holdings.
 */
export interface CountryArsenal {
  /** ISO 3166-1 alpha-2 code, echoing the path parameter. */
  countryCode: string;
  /**
   * Operator type to the firearms that type operates.
   *
   * Keys are dynamic (`military`, `law_enforcement`, `civilian`, ... and
   * `unknown` for entries with no type recorded), because the set is whatever
   * the catalog holds for that country rather than a closed vocabulary.
   *
   * This used to be typed `{ country, totalFirearms, groups[] }`, which the
   * API has never sent - the example in `getArsenal` read `data.country.name`
   * and threw on the first line. Nothing caught it until the documented
   * examples started being executed against the live API.
   */
  arsenal: Record<string, CountryArsenalEntry[]>;
}

/** One adoption record: who operates the firearm, and since when. */
export interface CountryArsenalEntry {
  user_name: string;
  user_type: string | null;
  adopted_year: number | null;
  designation: string | null;
  firearm_id: string;
  firearm_name: string;
}


/**
 * Ballistics data for a caliber at a given distance.
 */
export interface BallisticsResult {
  /** Caliber slug or ID. */
  caliberId: string;
  /** Distance in meters. */
  distanceM: number;
  /** Bullet velocity at the given distance (fps). */
  velocityFps: number;
  /** Bullet energy at the given distance (ft-lbs). */
  energyFtLbs: number;
  /** Bullet drop at the given distance (inches). */
  dropInches: number;
  /** Wind drift at the given distance (inches). */
  driftInches?: number;
  /** Time of flight in seconds. */
  timeOfFlightS?: number;
}

/**
 * SVG silhouette data for a firearm.
 */
export interface Silhouette {
  /** The firearm slug. */
  slug: string;
  /** Raw SVG string (when format is "svg"). */
  svg?: string;
  /** Base64 data URI (when format is "datauri"). */
  dataUri?: string;
  /** Stroke width used. */
  strokeWidth?: number;
  /** Stroke color used. */
  strokeColor?: string;
  /** Original image width in pixels. */
  width?: number;
  /** Original image height in pixels. */
  height?: number;
}

/**
 * Game balance report identifying outlier firearms.
 */
export interface BalanceReport {
  /** Threshold percentage used for outlier detection. */
  threshold: number;
  /** Total firearms analyzed. */
  totalAnalyzed: number;
  /** Firearms flagged as overpowered. */
  overpowered: BalanceEntry[];
  /** Firearms flagged as underpowered. */
  underpowered: BalanceEntry[];
  /** Deviations by stat. */
  deviations?: BalanceDeviation[];
}

/**
 * A roster of firearms suited for a specific game role.
 */
export interface RoleRoster {
  /** The role that was queried. */
  role: string;
  /** Total firearms considered. */
  totalConsidered: number;
  /** Firearms ranked by suitability for the role. */
  firearms: RoleRosterItem[];
}

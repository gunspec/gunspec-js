// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: firearm-analysis
// ---------------------------------------------------------------------------
import type { Caliber } from './catalog';
import type { Firearm, FirearmDetail } from './firearm';

// ── Firearm Comparisons ────────────────────────────────────────────────────

/**
 * Comparison result for multiple firearms.
 *
 * Returned by `GET /v1/firearms/compare`.
 */
export interface FirearmComparison {
  /** Full detail records for each compared firearm. */
  items: FirearmDetail[];
  /** One row per field whose value differs, in the order the API ranks them. */
  deltas: FirearmComparisonDelta[];
}

/** How one field differs across the compared firearms. */
export interface FirearmComparisonDelta {
  /** The field, named as the record names it, e.g. `weightEmptyG`. */
  field: string;
  /** The field on each firearm, in the order `items` lists them. Null where a record does not carry it. */
  values: Array<number | null>;
  /** Lowest value across the firearms. Null when fewer than two carry the field. */
  min: number | null;
  /** Highest value across the firearms. Null when fewer than two carry the field. */
  max: number | null;
  /** Spread as a percentage of the lowest value. Null when it cannot be computed. */
  percentDiff: number | null;
}

/**
 * Comparison result for multiple calibers.
 *
 * Returned by `GET /v1/calibers/compare`.
 */
export interface CaliberComparison {
  /** Full caliber records. */
  items: Caliber[];
  /** Per-field deltas between the compared calibers. */
  deltas: Record<string, unknown>;
}

// ── Head-to-Head ───────────────────────────────────────────────────────────

/**
 * Head-to-head comparison of two firearms on numeric specs.
 *
 * Returned by `GET /v1/firearms/head-to-head`.
 */
export interface HeadToHead {
  /** Firearm A raw data (snake_case keys from D1). */
  a: Record<string, unknown>;
  /** Firearm B raw data (snake_case keys from D1). */
  b: Record<string, unknown>;
  /** Per-field verdicts indicating which firearm is superior. */
  verdicts: Record<string, {
    /** Which firearm wins for this field. */
    winner: 'a' | 'b' | 'draw';
    /** Value for firearm A. */
    a: number | null;
    /** Value for firearm B. */
    b: number | null;
    /** Human-readable description of why the winner is better. */
    better: string;
  }>;
}

// ── Family Tree ────────────────────────────────────────────────────────────

/**
 * Firearm family tree (ancestors + current + descendants).
 *
 * Returned by `GET /v1/firearms/:id/family`.
 */
export interface FamilyTree {
  /** Ancestor firearms (oldest first). */
  ancestors: Record<string, unknown>[];
  /** The requested firearm (full record). */
  current: Firearm;
  /** Descendant / variant firearms. */
  descendants: Record<string, unknown>[];
}

// ── Similar Firearms ───────────────────────────────────────────────────────

/**
 * A similar firearm with a computed similarity score.
 *
 * Returned by `GET /v1/firearms/:id/similar`.
 */
export interface SimilarFirearm {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Similarity score (higher is more similar). */
  score: number;
}

// ── Adoption Map ───────────────────────────────────────────────────────────

/**
 * Adoption map for a firearm, grouped by country.
 *
 * Returned by `GET /v1/firearms/:id/adoption`.
 */
export interface AdoptionMap {
  /** Firearm slug. */
  firearmId: string;
  /** Firearm name. */
  firearmName: string;
  /** Users grouped by country. */
  countries: Array<{
    /** ISO country code (may be `null` for unknown). */
    code: string | null;
    /** Institutional users in this country. */
    users: Array<{
      name: string;
      type: string | null;
      year: number | null;
      designation: string | null;
    }>;
  }>;
}

// ── Top Firearms ───────────────────────────────────────────────────────────

/**
 * A firearm in a "top N" ranking.
 *
 * Returned by `GET /v1/firearms/top`.
 */
export interface TopFirearmItem {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Manufacturer slug. */
  manufacturerId: string;
  /** Category slug. */
  categoryId: string;
  /** The stat value used for ranking. */
  value: number;
  /** Unit of the stat (e.g. `"g"`, `"m"`, `"rpm"`). */
  unit: string;
}

// ── Power Rating ───────────────────────────────────────────────────────────

/**
 * A firearm's computed power rating with breakdown.
 *
 * Returned by `GET /v1/firearms/power-rating`.
 */
export interface PowerRating {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Manufacturer slug. */
  manufacturerId: string;
  /** Category slug. */
  categoryId: string;
  /** Composite power rating (0-100 scale). */
  powerRating: number;
  /** Per-component breakdown of the power rating. */
  breakdown: {
    /** Energy component (max 30). */
    energy: number;
    /** Range component (max 25). */
    range: number;
    /** Fire rate component (max 20). */
    fireRate: number;
    /** Capacity component (max 15). */
    capacity: number;
    /** Mobility component (max 10). */
    mobility: number;
  };
}

// ── Timeline ───────────────────────────────────────────────────────────────

/**
 * A firearm in a chronological timeline listing.
 *
 * Returned by `GET /v1/firearms/timeline`.
 */
export interface TimelineItem {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Manufacturer slug. */
  manufacturerId: string;
  /** Category slug. */
  categoryId: string;
  /** Year introduced. */
  yearIntroduced: number | null;
  /** Year discontinued. */
  yearDiscontinued: number | null;
  /** Production status. */
  status: string | null;
  /** Country of origin ISO code. */
  countryOfOrigin: string | null;
}

// ── Dimensions ─────────────────────────────────────────────────────────────

/**
 * Firearm dimensions in both metric and imperial units.
 *
 * Returned by `GET /v1/firearms/:id/dimensions`.
 */
export interface Dimensions {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Metric measurements. */
  metric: {
    weightEmptyG: number | null;
    weightLoadedG: number | null;
    overallLengthMm: number | null;
    barrelLengthMm: number | null;
    heightMm: number | null;
    widthMm: number | null;
    foldedLengthMm: number | null;
  };
  /** Imperial measurements (converted from metric). */
  imperial: {
    weightEmptyLbs: number | null;
    weightLoadedLbs: number | null;
    overallLengthIn: number | null;
    barrelLengthIn: number | null;
    heightIn: number | null;
    widthIn: number | null;
    foldedLengthIn: number | null;
  };
}

// ── Filter Options ─────────────────────────────────────────────────────────

/**
 * Available filter dropdown options.
 *
 * Returned by `GET /v1/firearms/filters`.
 */
export interface FilterOptions {
  /** Available categories. */
  categories: Array<{ slug: string; name: string }>;
  /** Available manufacturers. */
  manufacturers: Array<{ id: string; name: string }>;
  /** Available calibers. */
  calibers: Array<{ id: string; name: string }>;
  /** Available action types. */
  actionTypes: Array<{ id: string; name: string }>;
}

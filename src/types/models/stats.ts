// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: stats
// ---------------------------------------------------------------------------

// ── Statistics ──────────────────────────────────────────────────────────────

/**
 * Database summary statistics.
 *
 * Returned by `GET /v1/stats/summary`.
 */
export interface StatsSummary {
  /** Total number of firearms. */
  total_firearms: number;
  /** Total number of manufacturers. */
  total_manufacturers: number;
  /** Total number of calibers. */
  total_calibers: number;
  /** Number of distinct countries of origin. */
  countries_of_origin: number;
  /** Average data confidence percentage. */
  avg_confidence: number | null;
  /** Total number of firearm variants. */
  total_variants: number;
}

/**
 * Production status breakdown.
 *
 * Returned by `GET /v1/stats/production-status`.
 */
export interface ProductionStatusItem {
  /** Status value. */
  status: string;
  /** Number of firearms with this status. */
  count: number;
}

/**
 * Field coverage percentage for a single field.
 *
 * Returned by `GET /v1/stats/field-coverage`.
 */
export interface FieldCoverage {
  /** Field name (snake_case column name). */
  field: string;
  /** Percentage of firearms with a non-null value (0-100). */
  percentage: number;
}

/**
 * Popular caliber with firearm count.
 *
 * Returned by `GET /v1/stats/popular-calibers`.
 */
export interface PopularCaliber {
  /** Caliber slug. */
  id: string;
  /** Caliber display name. */
  name: string;
  /** NATO designation. */
  nato_designation: string | null;
  /** Number of firearms chambered in this caliber. */
  firearm_count: number;
}

/**
 * Prolific manufacturer with firearm count.
 *
 * Returned by `GET /v1/stats/prolific-manufacturers`.
 */
export interface ProlificManufacturer {
  /** Manufacturer slug. */
  id: string;
  /** Manufacturer name. */
  name: string;
  /** Country code. */
  country_code: string | null;
  /** Number of firearms produced. */
  firearm_count: number;
}

/**
 * Category statistics with averages.
 *
 * Returned by `GET /v1/stats/by-category`.
 */
export interface CategoryStats {
  /** Category slug. */
  id: string;
  /** Category name. */
  name: string;
  /** Number of firearms in this category. */
  firearm_count: number;
  /** Average weight in grams. */
  avg_weight_g: number | null;
  /** Average magazine capacity. */
  avg_magazine_capacity: number | null;
  /** Average barrel length in mm. */
  avg_barrel_length_mm: number | null;
}

/**
 * Era (decade) statistics.
 *
 * Returned by `GET /v1/stats/by-era`.
 */
export interface EraStats {
  /** Number of firearms introduced in this decade. */
  firearm_count: number;
  /** Average weight in grams. */
  avg_weight_g: number | null;
  /** Average magazine capacity. */
  avg_magazine_capacity: number | null;
  /** Average barrel length in mm. */
  avg_barrel_length_mm: number | null;
  /** Earliest year in the decade with data. */
  earliest_year: number | null;
  /** Latest year in the decade with data. */
  latest_year: number | null;
}

/**
 * Material usage breakdown per component.
 *
 * Returned by `GET /v1/stats/materials`.
 */
export interface MaterialStats {
  /** Frame materials. */
  frame: Array<{ material: string; count: number }>;
  /** Slide materials. */
  slide: Array<{ material: string; count: number }>;
  /** Barrel materials. */
  barrel: Array<{ material: string; count: number }>;
  /** Stock materials. */
  stock: Array<{ material: string; count: number }>;
}

/**
 * Adoption record by country.
 *
 * Returned by `GET /v1/stats/adoption/country`.
 */
export interface AdoptionByCountryItem {
  /** Firearm user record ID. */
  id: number;
  /** User / organisation name. */
  user_name: string;
  /** User type. */
  user_type: string | null;
  /** Year adopted. */
  adopted_year: number | null;
  /** Service designation. */
  designation: string | null;
  /** Firearm slug. */
  firearm_id: string;
  /** Firearm name. */
  firearm_name: string;
}

/**
 * Adoption record by user type.
 *
 * Returned by `GET /v1/stats/adoption/type`.
 */
export interface AdoptionByTypeItem {
  /** Firearm slug. */
  firearm_id: string;
  /** Firearm name. */
  firearm_name: string;
  /** Number of countries that adopted this firearm for this role. */
  adoption_count: number;
  /** List of country codes. */
  countries: string[];
}

/**
 * Action type frequency.
 *
 * Returned by `GET /v1/stats/action-types`.
 */
export interface ActionTypeStats {
  /** Action type slug. */
  action_type: string;
  /** Number of firearms with this action type. */
  count: number;
}

/**
 * Feature frequency item.
 *
 * Returned by `GET /v1/stats/feature-frequency`.
 */
export interface FeatureFrequency {
  /** Feature name. */
  feature: string;
  /** Number of firearms with this feature. */
  count: number;
}

/**
 * Caliber popularity within a decade.
 *
 * Returned by `GET /v1/stats/caliber-popularity-by-era`.
 */
export interface CaliberPopularityByEra {
  /** Decade label (e.g. `"1990s"`). */
  decade: string;
  /** Calibers ranked by popularity within this decade. */
  calibers: Array<{
    caliberId: string;
    caliberName: string;
    firearmCount: number;
  }>;
}

// ── Data Quality ───────────────────────────────────────────────────────────

/**
 * Data coverage summary.
 *
 * Returned by `GET /v1/data/coverage`.
 */
export interface DataCoverage {
  firearms: TableCoverage;
  calibers: TableCoverage;
  manufacturers: TableCoverage;
}

/**
 * Per-field completeness for one table.
 *
 * `DataCoverage` used to be typed as a single `{ field, percentage }` row,
 * which is neither what the endpoint returns nor enough to render the coverage
 * report it exists for. The documented example iterated `data.fields` and
 * threw; running the examples is what surfaced it.
 */
export interface TableCoverage {
  /** Total records in the table. */
  total: number;
  /** Column name to how many rows carry a value, and the share that is. */
  fields: Record<string, { filled: number; percentage: number }>;
}


/**
 * A firearm record with its computed data confidence score.
 *
 * Returned by the data quality confidence endpoint.
 */
export interface ConfidenceEntry {
  /** Firearm slug. */
  slug: string;
  /** Firearm display name. */
  name: string;
  /** Confidence score (0-1). */
  confidenceScore: number;
  /** Number of non-null specification fields. */
  filledFields: number;
  /** Total number of specification fields. */
  totalFields: number;
}

// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Request parameters: shared
// ---------------------------------------------------------------------------

// ── Pagination (shared base) ───────────────────────────────────────────────

/**
 * Common pagination parameters accepted by all list endpoints.
 *
 * @example
 * ```ts
 * const params: PaginationParams = { page: 2, per_page: 50, order: 'desc' };
 * ```
 */
export interface PaginationParams {
  /**
   * Page number (1-based).
   * @defaultValue `1`
   */
  page?: number;
  /**
   * Number of items per page (1-100).
   * @defaultValue `20`
   */
  per_page?: number;
  /** Column to sort by. Allowed values depend on the endpoint. */
  sort?: string;
  /**
   * Sort direction.
   * @defaultValue `"asc"`
   */
  order?: 'asc' | 'desc';
}

// ── Common Path Params ─────────────────────────────────────────────────────

/**
 * Standard slug path parameter used across many detail endpoints.
 *
 * @example
 * ```ts
 * // GET /v1/firearms/:id
 * const param: SlugParam = { id: 'glock-g17' };
 * ```
 */
export interface SlugParam {
  /** URL-safe slug identifier (lowercase alphanumeric + hyphens). */
  id: string;
}

/**
 * Category slug path parameter.
 *
 * @example
 * ```ts
 * // GET /v1/categories/:slug/firearms
 * const param: CategorySlugParam = { slug: 'pistol' };
 * ```
 */
export interface CategorySlugParam {
  /** Category slug. */
  slug: string;
}

/**
 * Game-stats version path parameter.
 */
export interface VersionParam {
  /** Snapshot version string (e.g. `"1.0.0"`). */
  version: string;
}

/**
 * Game-stats version + firearm path parameters.
 */
export interface VersionFirearmParam {
  /** Snapshot version string. */
  version: string;
  /** Firearm slug. */
  id: string;
}

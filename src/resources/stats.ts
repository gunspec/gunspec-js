/**
 * Statistics resource for the GunSpec SDK.
 *
 * Provides access to all `/v1/stats` endpoints for retrieving aggregate
 * statistics about the firearms database including production status,
 * field coverage, caliber popularity, and more.
 *
 * @module
 */

import type { HttpClient, APIResponse } from '../core';
import type {
  StatsSummary,
  ProductionStatusItem,
  FieldCoverage,
  PopularCaliber,
  ProlificManufacturer,
  CategoryStats,
  EraStats,
  MaterialStats,
  AdoptionByCountryItem,
  AdoptionByTypeItem,
  ActionTypeStats,
  FeatureFrequency,
  CaliberPopularityByEra,
  PopularCalibersParams,
  ProlificManufacturersParams,
  ByEraParams,
  AdoptionByCountryParams,
  AdoptionByTypeParams,
  ActionTypesParams,
  FeatureFrequencyParams,
  CaliberPopularityByEraParams,
  CatalogCoverage,
} from '../types';

/**
 * Resource class for interacting with the GunSpec Statistics API.
 *
 * Wraps all `/v1/stats` endpoints. Instantiated internally by the
 * {@link GunSpec} client and exposed as `client.stats`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * const { data } = await client.stats.summary();
 * console.log(data.totalFirearms, data.totalManufacturers);
 * ```
 */
export class StatsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Get a high-level summary of the database.
   *
   * @returns Summary counts for firearms, manufacturers, calibers, and categories.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.summary();
   * console.log(`Database has ${data.totalFirearms} firearms`);
   * ```
   */
  async summary(): Promise<APIResponse<StatsSummary>> {
    return this.client.get<StatsSummary>('/v1/stats/summary');
  }

  /**
   * Get firearm counts grouped by production status.
   *
   * @returns Counts for in-production, discontinued, and prototype firearms.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.productionStatus();
   * // { in_production: 342, discontinued: 891, prototype: 12 }
   * ```
   */
  async productionStatus(): Promise<APIResponse<ProductionStatusItem[]>> {
    return this.client.get<ProductionStatusItem[]>('/v1/stats/production-status');
  }

  /**
   * Get field coverage statistics across the database.
   *
   * Shows the percentage of firearms that have data for each field,
   * useful for assessing data completeness.
   *
   * @returns Per-field coverage percentages.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.fieldCoverage();
   * console.log(`Weight field: ${data.weight}% coverage`);
   * ```
   */
  async fieldCoverage(): Promise<APIResponse<FieldCoverage>> {
    return this.client.get<FieldCoverage>('/v1/stats/field-coverage');
  }

  /**
   * Get the most popular calibers by firearm count.
   *
   * @param params - Optional limit parameter.
   * @returns An ordered list of calibers ranked by the number of firearms using them.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.popularCalibers({ limit: 10 });
   * for (const entry of data) {
   *   console.log(`${entry.name}: ${entry.count} firearms`);
   * }
   * ```
   */
  async popularCalibers(params?: PopularCalibersParams): Promise<APIResponse<PopularCaliber[]>> {
    return this.client.get<PopularCaliber[]>('/v1/stats/calibers/popular', params);
  }

  /**
   * Get the most prolific manufacturers by firearm count.
   *
   * @param params - Optional limit and category filter.
   * @returns An ordered list of manufacturers ranked by the number of firearms produced.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.prolificManufacturers({
   *   limit: 10,
   *   category: 'pistol',
   * });
   * ```
   */
  async prolificManufacturers(params?: ProlificManufacturersParams): Promise<APIResponse<ProlificManufacturer[]>> {
    return this.client.get<ProlificManufacturer[]>('/v1/stats/manufacturers/prolific', params);
  }

  /**
   * Get firearm counts grouped by category.
   *
   * @returns Counts per category (pistol, rifle, shotgun, etc.).
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.byCategory();
   * // [{ category: 'pistol', count: 512 }, { category: 'rifle', count: 234 }, ...]
   * ```
   */
  async byCategory(): Promise<APIResponse<CategoryStats[]>> {
    return this.client.get<CategoryStats[]>('/v1/stats/by-category');
  }

  /**
   * Get firearm statistics for a specific decade/era.
   *
   * @param params - The decade string (e.g. `"1990s"`).
   * @returns Statistics for firearms introduced during the specified decade.
   * @throws {BadRequestError} If the decade format is invalid (must be like `"1990s"`).
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.byEra({ decade: '1940s' });
   * ```
   */
  async byEra(params: ByEraParams): Promise<APIResponse<EraStats>> {
    return this.client.get<EraStats>('/v1/stats/by-era', params);
  }

  /**
   * Get statistics about materials used across all firearms.
   *
   * @returns Material usage counts and percentages by component type.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.materials();
   * ```
   */
  async materials(): Promise<APIResponse<MaterialStats>> {
    return this.client.get<MaterialStats>('/v1/stats/materials');
  }

  /**
   * Get firearm adoption statistics for a specific country.
   *
   * @param params - The country code (e.g. `"US"`, `"GB"`).
   * @returns Adoption data for the specified country.
   * @throws {BadRequestError} If the country code is invalid.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.adoptionByCountry({ code: 'US' });
   * ```
   */
  async adoptionByCountry(params: AdoptionByCountryParams): Promise<APIResponse<AdoptionByCountryItem[]>> {
    return this.client.get<AdoptionByCountryItem[]>('/v1/stats/adoption/by-country', params);
  }

  /**
   * Get firearm adoption statistics by usage type.
   *
   * @param params - The usage type (e.g. `"military"`, `"law_enforcement"`, `"civilian"`).
   * @returns Adoption data for the specified usage type.
   * @throws {BadRequestError} If the type is not a recognized usage category.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.adoptionByType({ type: 'military' });
   * ```
   */
  async adoptionByType(params: AdoptionByTypeParams): Promise<APIResponse<AdoptionByTypeItem[]>> {
    return this.client.get<AdoptionByTypeItem[]>('/v1/stats/adoption/by-type', params);
  }

  /**
   * Get firearm counts grouped by action type.
   *
   * @param params - Optional category filter.
   * @returns Counts per action type, optionally filtered by category.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.actionTypes({ category: 'rifle' });
   * ```
   */
  async actionTypes(params?: ActionTypesParams): Promise<APIResponse<ActionTypeStats[]>> {
    return this.client.get<ActionTypeStats[]>('/v1/stats/action-types', params);
  }

  /**
   * Get feature frequency statistics across the database.
   *
   * @param params - Optional category filter and result limit.
   * @returns An ordered list of features ranked by frequency of occurrence.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.featureFrequency({
   *   category: 'pistol',
   *   limit: 20,
   * });
   * ```
   */
  async featureFrequency(params?: FeatureFrequencyParams): Promise<APIResponse<FeatureFrequency[]>> {
    return this.client.get<FeatureFrequency[]>('/v1/stats/feature-frequency', params);
  }

  /**
   * Get caliber popularity trends across historical eras.
   *
   * @param params - Optional from/to decade range (e.g. `"1940s"` to `"2020s"`).
   * @returns Caliber popularity data broken down by decade.
   * @throws {BadRequestError} If the decade format is invalid.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.caliberPopularityByEra({
   *   from_decade: '1940s',
   *   to_decade: '2020s',
   * });
   * ```
   */
  async caliberPopularityByEra(params?: CaliberPopularityByEraParams): Promise<APIResponse<CaliberPopularityByEra[]>> {
    return this.client.get<CaliberPopularityByEra[]>('/v1/stats/caliber-popularity-by-era', params);
  }

  /**
   * Get catalog completeness percentages.
   *
   * Reports what share of firearms have a line-art image, core specifications
   * filled, at least one caliber mapped, and a recorded weight. Computed live.
   *
   * @returns The four headline coverage figures plus the catalog total.
   *
   * @example
   * ```typescript
   * const { data } = await client.stats.catalogCoverage();
   * console.log(`${data.images}% of ${data.total} firearms have line art`);
   * ```
   */
  async catalogCoverage(): Promise<APIResponse<CatalogCoverage>> {
    return this.client.get<CatalogCoverage>('/v1/stats/catalog-coverage');
  }
}

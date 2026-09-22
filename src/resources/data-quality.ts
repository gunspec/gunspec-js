/**
 * Data Quality resource for the GunSpec SDK.
 *
 * Provides access to `/v1/data` endpoints for assessing database
 * coverage and per-record confidence scores.
 *
 * @module
 */

import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  DataCoverage,
  ConfidenceEntry,
  ConfidenceParams,
} from '../types';

/**
 * Resource class for interacting with the GunSpec Data Quality API.
 *
 * Wraps all `/v1/data` endpoints. Instantiated internally by the
 * {@link GunSpec} client and exposed as `client.dataQuality`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * // Check overall data coverage
 * const { data } = await client.dataQuality.coverage();
 * console.log(`${data.overallCoverage}% overall field coverage`);
 *
 * // Find low-confidence records
 * const lowConf = await client.dataQuality.confidence({ below: 0.3 });
 * ```
 */
export class DataQualityResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Get overall data coverage statistics for the database.
   *
   * Returns per-field and aggregate coverage metrics showing what
   * percentage of records have data for each field.
   *
   * @returns Data coverage statistics including per-field percentages.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.dataQuality.coverage();
   * console.log(`${data.firearms.total} firearms`);
   * for (const [field, stats] of Object.entries(data.firearms.fields)) {
   *   console.log(`${field}: ${stats.percentage}%`);
   * }
   * ```
   */
  async coverage(): Promise<APIResponse<DataCoverage>> {
    return this.client.get<DataCoverage>('/v1/data/coverage');
  }

  /**
   * Get firearms with confidence scores below a specified threshold.
   *
   * Useful for identifying records that may need additional data
   * verification or enrichment.
   *
   * @param params - Optional threshold and pagination parameters.
   * @returns A paginated list of firearms with their confidence scores.
   * @throws {BadRequestError} If the threshold is outside the 0-1 range.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.dataQuality.confidence({
   *   below: 0.5,
   *   per_page: 25,
   * });
   * for (const item of result.data) {
   *   console.log(`${item.name}: confidence ${item.confidenceScore}`);
   * }
   * ```
   */
  async confidence(params?: ConfidenceParams): Promise<PaginatedResponse<ConfidenceEntry>> {
    return this.client.getPaginated<ConfidenceEntry>('/v1/data/confidence', params);
  }
}

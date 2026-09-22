/**
 * Countries resource for the GunSpec SDK.
 *
 * Provides access to `/v1/countries` endpoints for listing countries
 * and retrieving a country's full firearm arsenal.
 *
 * @module
 */

import { pathSegment } from '../core/path';
import type { HttpClient, APIResponse } from '../core';
import type {
  Country,
  CountryArsenal,
} from '../types';

/**
 * Resource class for interacting with the GunSpec Countries API.
 *
 * Wraps all `/v1/countries` endpoints. Instantiated internally by the
 * {@link GunSpec} client and exposed as `client.countries`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * // List all countries
 * const { data } = await client.countries.list();
 *
 * // Get a country's full arsenal
 * const { data: arsenal } = await client.countries.getArsenal('US');
 * ```
 */
export class CountriesResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List all countries that have adopted at least one firearm.
   *
   * @returns An array of country records with codes and names.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.countries.list();
   * for (const country of data) {
   *   console.log(country.code, country.name);
   * }
   * ```
   */
  async list(): Promise<APIResponse<Country[]>> {
    return this.client.get<Country[]>('/v1/countries');
  }

  /**
   * Get the full firearm arsenal for a specific country.
   *
   * Returns all firearms adopted by the country, grouped by usage type
   * (military, law enforcement, etc.).
   *
   * @param code - The country code (e.g. `"US"`, `"GB"`, `"DE"`).
   * @returns The country's arsenal data with firearms grouped by adoption type.
   * @throws {NotFoundError} If the country code is not found in the database.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.countries.getArsenal('US');
   * for (const [userType, entries] of Object.entries(data.arsenal)) {
   *   console.log(`${userType}: ${entries.length} firearms`);
   * }
   * ```
   */
  async getArsenal(code: string): Promise<APIResponse<CountryArsenal>> {
    return this.client.get<CountryArsenal>(`/v1/countries/${pathSegment(code)}/arsenal`);
  }
}

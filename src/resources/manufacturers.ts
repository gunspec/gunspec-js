/**
 * Manufacturers resource for the GunSpec SDK.
 *
 * Provides access to all `/v1/manufacturers` endpoints including listing,
 * retrieving details, and exploring a manufacturer's firearms catalog,
 * timeline, and statistics.
 *
 * @module
 */

import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  Manufacturer,
  Firearm,
  ManufacturerTimeline,
  ManufacturerStats,
  ListManufacturersParams,
  PaginationParams,
} from '../types';

/**
 * Resource class for interacting with the GunSpec Manufacturers API.
 *
 * Wraps all `/v1/manufacturers` endpoints. Instantiated internally by the
 * {@link GunSpec} client and exposed as `client.manufacturers`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * // List manufacturers
 * const { data } = await client.manufacturers.list({ country: 'US' });
 *
 * // Get manufacturer details
 * const { data: mfr } = await client.manufacturers.get('beretta');
 * ```
 */
export class ManufacturersResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List manufacturers with optional filters and pagination.
   *
   * @param params - Optional query parameters for filtering by country, sorting, and pagination.
   * @returns A paginated list of manufacturers.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.manufacturers.list({
   *   country: 'DE',
   *   sort: 'name',
   *   order: 'asc',
   *   per_page: 50,
   * });
   * ```
   */
  async list(params?: ListManufacturersParams): Promise<PaginatedResponse<Manufacturer>> {
    return this.client.getPaginated<Manufacturer>('/v1/manufacturers', params);
  }

  /**
   * Auto-paginate through all manufacturers matching the given filters.
   *
   * Returns an async iterator that fetches pages on demand, yielding
   * individual {@link Manufacturer} objects.
   *
   * @param params - Optional query parameters for filtering and sorting.
   * @returns An async iterable iterator yielding individual manufacturers.
   *
   * @example
   * ```typescript
   * let seen = 0;
   * for await (const mfr of client.manufacturers.listAutoPaging()) {
   *   console.log(mfr.name, mfr.country);
   *   // Drop this to walk the whole collection.
   *   if (++seen >= 5) break;
   * }
   * ```
   */
  async *listAutoPaging(params?: ListManufacturersParams): AsyncIterableIterator<Manufacturer> {
    let page = params?.page ?? 1;
    while (true) {
      const result = await this.list({ ...params, page });
      for (const item of result.data) {
        yield item;
      }
      if (!result.pagination.totalPages || page >= result.pagination.totalPages) break;
      page++;
    }
  }

  /**
   * Get a single manufacturer by its slug or ID.
   *
   * @param id - The manufacturer slug (e.g. `"beretta"`) or numeric ID.
   * @returns The full manufacturer record.
   * @throws {NotFoundError} If no manufacturer matches the given identifier.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.manufacturers.get('sig-sauer');
   * console.log(data.name, data.foundedYear, data.country);
   * ```
   */
  async get(id: string): Promise<APIResponse<Manufacturer>> {
    return this.client.get<Manufacturer>(`/v1/manufacturers/${encodeURIComponent(id)}`);
  }

  /**
   * Get all firearms produced by a manufacturer.
   *
   * @param id - The manufacturer slug or ID.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of firearms from the specified manufacturer.
   * @throws {NotFoundError} If the manufacturer does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.manufacturers.getFirearms('colt', { per_page: 50 });
   * console.log(`Colt makes ${result.pagination.total} firearms`);
   * ```
   */
  async getFirearms(id: string, params?: PaginationParams): Promise<PaginatedResponse<Firearm>> {
    return this.client.getPaginated<Firearm>(
      `/v1/manufacturers/${encodeURIComponent(id)}/firearms`,
      params,
    );
  }

  /**
   * Get a chronological timeline for a manufacturer.
   *
   * @param id - The manufacturer slug or ID.
   * @returns Timeline data with key events, product launches, and milestones.
   * @throws {NotFoundError} If the manufacturer does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.manufacturers.getTimeline('browning');
   * for (const entry of data.timeline) {
   *   console.log(entry.year, entry.firearms.map(f => f.name));
   * }
   * ```
   */
  async getTimeline(id: string): Promise<APIResponse<ManufacturerTimeline>> {
    return this.client.get<ManufacturerTimeline>(`/v1/manufacturers/${encodeURIComponent(id)}/timeline`);
  }

  /**
   * Get aggregate statistics for a manufacturer.
   *
   * @param id - The manufacturer slug or ID.
   * @returns Statistical summary including firearm counts, caliber distribution, and more.
   * @throws {NotFoundError} If the manufacturer does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.manufacturers.getStats('glock');
   * console.log(data.totalFirearms, data.caliberBreakdown);
   * ```
   */
  async getStats(id: string): Promise<APIResponse<ManufacturerStats>> {
    return this.client.get<ManufacturerStats>(`/v1/manufacturers/${encodeURIComponent(id)}/stats`);
  }
}

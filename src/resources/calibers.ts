/**
 * Calibers resource for the GunSpec SDK.
 *
 * Provides access to all `/v1/calibers` endpoints including listing,
 * comparing, ballistics calculations, and exploring caliber families
 * and associated ammunition.
 *
 * @module
 */

import { pathSegment } from '../core/path';
import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  CaliberFamily,
  Caliber,
  Firearm,
  Ammunition,
  BallisticsResult,
  ListCalibersParams,
  CompareCalibersParams,
  CaliberBallisticsParams,
  PaginationParams,
} from '../types';

/**
 * Resource class for interacting with the GunSpec Calibers API.
 *
 * Wraps all `/v1/calibers` endpoints. Instantiated internally by the
 * {@link GunSpec} client and exposed as `client.calibers`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * // List calibers
 * const { data } = await client.calibers.list({ cartridge_type: 'centerfire' });
 *
 * // Compare calibers
 * const { data: comparison } = await client.calibers.compare({
 *   ids: '9x19mm-parabellum,45-acp',
 * });
 * ```
 */
export class CalibersResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List calibers with optional filters and pagination.
   *
   * @param params - Optional query parameters for filtering by cartridge type, primer type, etc.
   * @returns A paginated list of calibers.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.calibers.list({
   *   cartridge_type: 'centerfire',
   *   primer_type: 'boxer',
   *   per_page: 50,
   * });
   * ```
   */
  async list(params?: ListCalibersParams): Promise<PaginatedResponse<Caliber>> {
    return this.client.getPaginated<Caliber>('/v1/calibers', params);
  }

  /**
   * Auto-paginate through all calibers matching the given filters.
   *
   * Returns an async iterator that fetches pages on demand, yielding
   * individual {@link Caliber} objects.
   *
   * @param params - Optional query parameters for filtering and sorting.
   * @returns An async iterable iterator yielding individual calibers.
   *
   * @example
   * ```typescript
   * let seen = 0;
   * for await (const caliber of client.calibers.listAutoPaging()) {
   *   console.log(caliber.name, caliber.bulletDiameterMm);
   *   // Drop this to walk the whole collection.
   *   if (++seen >= 5) break;
   * }
   * ```
   */
  async *listAutoPaging(params?: ListCalibersParams): AsyncIterableIterator<Caliber> {
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
   * Compare up to 5 calibers side by side.
   *
   * @param params - Object containing comma-separated caliber IDs.
   * @returns An array of calibers with full details for comparison.
   * @throws {BadRequestError} If more than 5 IDs are provided.
   * @throws {NotFoundError} If any of the specified calibers do not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.calibers.compare({
   *   ids: '9x19mm-parabellum,45-acp,40-s-w',
   * });
   * ```
   */
  async compare(params: CompareCalibersParams): Promise<APIResponse<Caliber[]>> {
    return this.client.get<Caliber[]>('/v1/calibers/compare', params);
  }

  /**
   * Get ballistics data for a caliber at a specified distance.
   *
   * @param params - Caliber ID and distance in meters.
   * @returns Ballistic data including velocity, energy, and drop at the specified distance.
   * @throws {NotFoundError} If the caliber does not exist.
   * @throws {BadRequestError} If the distance is out of range.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.calibers.ballistics({
   *   id: '9x19mm-parabellum',
   *   distance: 100,
   * });
   * console.log(data.velocity, data.energy, data.drop);
   * ```
   */
  async ballistics(params: CaliberBallisticsParams): Promise<APIResponse<BallisticsResult>> {
    return this.client.get<BallisticsResult>('/v1/calibers/ballistics', params);
  }

  /**
   * Get a single caliber by its slug or ID.
   *
   * @param id - The caliber slug (e.g. `"9x19mm-parabellum"`) or numeric ID.
   * @returns The full caliber record with all specifications.
   * @throws {NotFoundError} If no caliber matches the given identifier.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.calibers.get('45-acp');
   * console.log(data.name, data.bulletDiameterMm, data.caseLengthMm);
   * ```
   */
  async get(id: string): Promise<APIResponse<Caliber>> {
    return this.client.get<Caliber>(`/v1/calibers/${pathSegment(id)}`);
  }

  /**
   * Get all firearms that use a specific caliber.
   *
   * @param id - The caliber slug or ID.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of firearms chambered in the specified caliber.
   * @throws {NotFoundError} If the caliber does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.calibers.getFirearms('9x19mm-parabellum', { per_page: 50 });
   * console.log(`${result.pagination.total} firearms use 9mm`);
   * ```
   */
  async getFirearms(id: string, params?: PaginationParams): Promise<PaginatedResponse<Firearm>> {
    return this.client.getPaginated<Firearm>(
      `/v1/calibers/${pathSegment(id)}/firearms`,
      params,
    );
  }

  /**
   * Get the parent caliber chain (ancestry) for a caliber.
   *
   * @param id - The caliber slug or ID.
   * @returns An ordered array of calibers from the given caliber up to the root ancestor.
   * @throws {NotFoundError} If the caliber does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.calibers.getParentChain('300-aac-blackout');
   * // [300 Blackout, 5.56x45mm NATO, .223 Remington, ...]
   * ```
   */
  async getParentChain(id: string): Promise<APIResponse<Caliber[]>> {
    return this.client.get<Caliber[]>(`/v1/calibers/${pathSegment(id)}/parent-chain`);
  }

  /**
   * Get the full family tree of related calibers.
   *
   * @param id - The caliber slug or ID.
   * @returns The cartridge's `ancestors`, the requested caliber as `current`,
   *   and its `descendants` - not a flat array: the shape is what carries the
   *   direction of each relationship.
   * @throws {NotFoundError} If the caliber does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.calibers.getFamily('9x19mm-parabellum');
   * console.log(data.current.name, data.descendants.map(c => c.name));
   * ```
   */
  async getFamily(id: string): Promise<APIResponse<CaliberFamily>> {
    return this.client.get<CaliberFamily>(`/v1/calibers/${pathSegment(id)}/family`);
  }

  /**
   * Get ammunition loads available for a caliber.
   *
   * @param id - The caliber slug or ID.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of ammunition loads for the specified caliber.
   * @throws {NotFoundError} If the caliber does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.calibers.getAmmunition('9x19mm-parabellum', { per_page: 25 });
   * for (const ammo of result.data) {
   *   console.log(ammo.name, ammo.bulletWeightGrains);
   * }
   * ```
   */
  async getAmmunition(id: string, params?: PaginationParams): Promise<PaginatedResponse<Ammunition>> {
    return this.client.getPaginated<Ammunition>(
      `/v1/calibers/${pathSegment(id)}/ammunition`,
      params,
    );
  }
}

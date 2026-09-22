/**
 * Ammunition resource for the GunSpec SDK.
 *
 * Provides access to all `/v1/ammunition` endpoints including listing,
 * retrieving details, bullet SVG generation, and ballistic calculations.
 *
 * @module
 */

import { pathSegment } from '../core/path';
import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  Ammunition,
  BallisticProfile,
  ListAmmunitionParams,
  AmmunitionBallisticsParams,
} from '../types';

/**
 * Resource class for interacting with the GunSpec Ammunition API.
 *
 * Wraps all `/v1/ammunition` endpoints. Instantiated internally by the
 * {@link GunSpec} client and exposed as `client.ammunition`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * // List ammunition
 * const { data } = await client.ammunition.list({ caliber_id: '9x19mm-parabellum' });
 *
 * // Get ballistics for a specific load
 * const { data: ballistics } = await client.ammunition.ballistics(
 *   'federal-hst-124jhp',
 *   { distances: '0,25,50,100' },
 * );
 * ```
 */
export class AmmunitionResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List ammunition with optional filters and pagination.
   *
   * @param params - Optional query parameters for filtering by caliber, bullet type, etc.
   * @returns A paginated list of ammunition loads.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.ammunition.list({
   *   caliber_id: '9x19mm-parabellum',
   *   bullet_type: 'hollow-point',
   *   per_page: 25,
   * });
   * ```
   */
  async list(params?: ListAmmunitionParams): Promise<PaginatedResponse<Ammunition>> {
    return this.client.getPaginated<Ammunition>('/v1/ammunition', params);
  }

  /**
   * Auto-paginate through all ammunition matching the given filters.
   *
   * Returns an async iterator that fetches pages on demand, yielding
   * individual {@link Ammunition} objects.
   *
   * @param params - Optional query parameters for filtering and sorting.
   * @returns An async iterable iterator yielding individual ammunition loads.
   *
   * @example
   * ```typescript
   * let seen = 0;
   * for await (const ammo of client.ammunition.listAutoPaging({ caliber_id: '45-acp' })) {
   *   console.log(ammo.name, ammo.bulletWeightGrains);
   *   // Drop this to walk the whole collection.
   *   if (++seen >= 5) break;
   * }
   * ```
   */
  async *listAutoPaging(params?: ListAmmunitionParams): AsyncIterableIterator<Ammunition> {
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
   * Get a single ammunition load by its slug or ID.
   *
   * @param id - The ammunition slug (e.g. `"federal-hst-124jhp"`) or numeric ID.
   * @returns The full ammunition record with specifications.
   * @throws {NotFoundError} If no ammunition matches the given identifier.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.ammunition.get('federal-hst-124jhp');
   * console.log(data.name, data.muzzleVelocityFps, data.bulletWeightGrains);
   * ```
   */
  async get(id: string): Promise<APIResponse<Ammunition>> {
    return this.client.get<Ammunition>(`/v1/ammunition/${pathSegment(id)}`);
  }

  /**
   * Get a bullet profile SVG image for an ammunition load.
   *
   * Returns a raw SVG string representing the bullet projectile shape.
   * This endpoint returns raw SVG content, not the standard JSON envelope.
   *
   * @param id - The ammunition slug or ID.
   * @returns The raw SVG string of the bullet profile.
   * @throws {NotFoundError} If the ammunition does not exist.
   *
   * @example
   * ```typescript
   * const svg = await client.ammunition.getBulletSvg('federal-hst-124jhp');
   * // Mount it by parsing the SVG, e.g. via DOMParser + element.append().
   * ```
   */
  async getBulletSvg(id: string): Promise<string> {
    return this.client.getText(`/v1/ammunition/${pathSegment(id)}/bullet.svg`);
  }

  /**
   * Get ballistic trajectory data for an ammunition load.
   *
   * @param id - The ammunition slug or ID.
   * @param params - Optional barrel length and distance parameters.
   * @returns Ballistic trajectory data at specified distances.
   * @throws {NotFoundError} If the ammunition does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.ammunition.ballistics('federal-hst-124jhp', {
   *   barrel_length_mm: 102,
   *   distances: '0,25,50,100,200',
   * });
   * for (const point of data.trajectory) {
   *   console.log(`${point.distanceM}m: ${point.velocityFps} fps, ${point.energyFtLbs} ft-lbs`);
   * }
   * ```
   */
  async ballistics(id: string, params?: AmmunitionBallisticsParams): Promise<APIResponse<BallisticProfile>> {
    return this.client.get<BallisticProfile>(
      `/v1/ammunition/${pathSegment(id)}/ballistics`,
      params,
    );
  }
}

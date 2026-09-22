/**
 * Categories resource for the GunSpec SDK.
 *
 * Provides access to `/v1/categories` endpoints for listing firearm
 * categories and retrieving firearms within a specific category.
 *
 * @module
 */

import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  Category,
  Firearm,
  PaginationParams,
} from '../types';

/**
 * Resource class for interacting with the GunSpec Categories API.
 *
 * Wraps all `/v1/categories` endpoints. Instantiated internally by the
 * {@link GunSpec} client and exposed as `client.categories`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * // List all categories
 * const { data } = await client.categories.list();
 * console.log(data.map(c => c.name));
 *
 * // Get firearms in a category
 * const pistols = await client.categories.getFirearms('pistol');
 * ```
 */
export class CategoriesResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List all firearm categories.
   *
   * @returns An array of all category records.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.categories.list();
   * // [{ slug: 'pistol', name: 'Pistol' }, { slug: 'rifle', name: 'Rifle' }, ...]
   * ```
   */
  async list(): Promise<APIResponse<Category[]>> {
    return this.client.get<Category[]>('/v1/categories');
  }

  /**
   * Get all firearms within a specific category.
   *
   * @param slug - The category slug (e.g. `"pistol"`, `"rifle"`, `"shotgun"`).
   * @param params - Optional pagination parameters.
   * @returns A paginated list of firearms in the specified category.
   * @throws {NotFoundError} If the category slug does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.categories.getFirearms('shotgun', {
   *   per_page: 25,
   *   sort: 'name',
   *   order: 'asc',
   * });
   * console.log(`${result.pagination.total} shotguns in database`);
   * ```
   */
  async getFirearms(slug: string, params?: PaginationParams): Promise<PaginatedResponse<Firearm>> {
    return this.client.getPaginated<Firearm>(
      `/v1/categories/${encodeURIComponent(slug)}/firearms`,
      params,
    );
  }
}

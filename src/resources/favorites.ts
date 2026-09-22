import { pathSegment } from '../core/path';
import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  Favorite,
  FavoriteToggle,
  ListFavoritesParams,
} from '../types';

/**
 * The signed-in account's favourited firearms.
 *
 * Session-scoped: these call `/v1/me/*` and answer 401 without a key that
 * belongs to a user account. A favourite is a slug, not a copy of the record,
 * so a firearm renamed in the catalog stays favourited.
 *
 * @example
 * ```typescript
 * await client.favorites.add('glock-17');
 * const { data } = await client.favorites.listIds();
 * console.log(data.ids.includes('glock-17')); // true
 * ```
 */
export class FavoritesResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * The full favourited records, paginated.
   *
   * @param params - Pagination and sort.
   * @returns One page of favourited firearms, each with the firearm record.
   */
  async list(params?: ListFavoritesParams): Promise<PaginatedResponse<Favorite>> {
    return this.client.getPaginated<Favorite>('/v1/me/favorites', params);
  }

  /**
   * List just the ids of your favorited firearms.
   *
   * Cheaper than {@link FavoritesResource.list} when you only need to render a
   * filled/unfilled state across a grid.
   *
   * @returns The firearm slugs you have favorited.
   */
  async listIds(): Promise<APIResponse<{ ids: string[] }>> {
    return this.client.get<{ ids: string[] }>('/v1/me/favorites/ids');
  }

  /**
   * Favourite a firearm. Idempotent: favouriting twice is one favourite.
   *
   * @param firearmId - The firearm slug.
   * @returns The new state, so a button can render from the response.
   */
  async add(firearmId: string): Promise<APIResponse<FavoriteToggle>> {
    return this.client.post<FavoriteToggle>(`/v1/me/favorites/${pathSegment(firearmId)}`);
  }

  /**
   * Remove a favourite. Idempotent: removing one you do not hold is not an error.
   *
   * @param firearmId - The firearm slug.
   * @returns The new state.
   */
  async remove(firearmId: string): Promise<APIResponse<FavoriteToggle>> {
    return this.client.delete<FavoriteToggle>(`/v1/me/favorites/${pathSegment(firearmId)}`);
  }
}

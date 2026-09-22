/**
 * Game Stats Snapshots resource for the GunSpec SDK.
 *
 * Provides access to `/v1/game-stats` endpoints for retrieving versioned
 * snapshots of game-balanced firearm statistics. Each snapshot captures
 * the game stats at a specific point in time, enabling version tracking
 * and historical comparisons.
 *
 * @module
 */

import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  GameStatsVersion,
  GameStatsSnapshotEntry,
  ListSnapshotFirearmsParams,
} from '../types';

/**
 * Resource class for interacting with the GunSpec Game Stats Snapshots API.
 *
 * Wraps all `/v1/game-stats` endpoints. Instantiated internally by the
 * {@link GunSpec} client and exposed as `client.gameStats`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * // List all snapshot versions
 * const { data: versions } = await client.gameStats.listVersions();
 *
 * // Get firearms from a specific version
 * const result = await client.gameStats.listFirearms('2025.1');
 * ```
 */
export class GameStatsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List all available game stats snapshot versions.
   *
   * @returns An array of version records with metadata about each snapshot.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.gameStats.listVersions();
   * for (const version of data) {
   *   console.log(version.version, version.createdAt, version.description);
   * }
   * ```
   */
  async listVersions(): Promise<APIResponse<GameStatsVersion[]>> {
    return this.client.get<GameStatsVersion[]>('/v1/game-stats/versions');
  }

  /**
   * List all firearms in a specific game stats snapshot version.
   *
   * @param version - The snapshot version string (e.g. `"2025.1"`). `listVersions()` is what publishes them.
   * @param params - Optional pagination parameters.
   * @returns A paginated list of firearms with their game stats for the given version.
   * @throws {NotFoundError} If the specified version does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.gameStats.listFirearms('2025.1', { per_page: 50 });
   * for (const firearm of result.data) {
   *   console.log(firearm.name, firearm.damage);
   * }
   * ```
   */
  async listFirearms(version: string, params?: ListSnapshotFirearmsParams): Promise<PaginatedResponse<GameStatsSnapshotEntry>> {
    return this.client.getPaginated<GameStatsSnapshotEntry>(
      `/v1/game-stats/versions/${encodeURIComponent(version)}/firearms`,
      params,
    );
  }

  /**
   * Get a single firearm's game stats from a specific snapshot version.
   *
   * @param version - The snapshot version string (e.g. `"2025.1"`). `listVersions()` is what publishes them.
   * @param id - The firearm slug or ID.
   * @returns The firearm's game stats as captured in the specified version.
   * @throws {NotFoundError} If the version or firearm does not exist in the snapshot.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.gameStats.getFirearm('2025.1', 'glock-g17');
   * console.log(data.damage, data.accuracy, data.range);
   * ```
   */
  async getFirearm(version: string, id: string): Promise<APIResponse<GameStatsSnapshotEntry>> {
    return this.client.get<GameStatsSnapshotEntry>(
      `/v1/game-stats/versions/${encodeURIComponent(version)}/firearms/${encodeURIComponent(id)}`,
    );
  }
}

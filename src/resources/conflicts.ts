/**
 * Conflicts resource for the GunSpec SDK.
 *
 * Provides access to the `/v1/conflicts` endpoint for listing military
 * conflicts and their associated firearms.
 *
 * @module
 */

import type { HttpClient, APIResponse } from '../core';
import type { Conflict } from '../types';

/**
 * Resource class for interacting with the GunSpec Conflicts API.
 *
 * Wraps the `/v1/conflicts` endpoint. Instantiated internally by the
 * {@link GunSpec} client and exposed as `client.conflicts`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * const { data } = await client.conflicts.list();
 * for (const conflict of data) {
 *   console.log(conflict.name, conflict.startYear, conflict.endYear);
 * }
 * ```
 */
export class ConflictsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List all military conflicts in the database.
   *
   * Returns conflicts with metadata including name, date range, and
   * participating nations. Use the conflict identifiers with
   * `client.firearms.byConflict()` to find firearms used in a specific conflict.
   *
   * @returns An array of all conflict records.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.conflicts.list();
   * for (const conflict of data) {
   *   console.log(`${conflict.name} (${conflict.startYear}-${conflict.endYear})`);
   * }
   *
   * // Then find firearms used in a conflict:
   * const wwii = await client.firearms.byConflict({ conflict: 'world-war-ii' });
   * ```
   */
  async list(): Promise<APIResponse<Conflict[]>> {
    return this.client.get<Conflict[]>('/v1/conflicts');
  }
}

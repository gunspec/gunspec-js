/**
 * Collections resource for the GunSpec SDK.
 *
 * Wraps `/v1/collections/{shareId}`, which reads a user collection that has
 * been shared publicly. The share id is the only credential - collections that
 * have not been shared are not reachable through it - so no API key is required.
 *
 * @module
 */

import { pathSegment } from '../core/path';
import type { HttpClient, APIResponse } from '../core';
import type { PublicCollection } from '../types';

/**
 * Resource class for publicly shared collections.
 *
 * Instantiated internally by the {@link GunSpec} client and exposed as
 * `client.collections`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * const { data } = await client.collections.getShared('a1b2c3d4e5');
 * console.log(data.name, `${data.itemCount} firearms`);
 * ```
 */
export class CollectionsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Get a publicly shared collection and the firearms in it.
   *
   * @param shareId - The 10-character public share id.
   * @returns The collection with its items.
   * @throws {NotFoundError} If the id is unknown or the collection is no longer shared.
   */
  async getShared(shareId: string): Promise<APIResponse<PublicCollection>> {
    return this.client.get<PublicCollection>(`/v1/collections/${pathSegment(shareId)}`);
  }
}

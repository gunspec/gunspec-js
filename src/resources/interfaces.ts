/**
 * Interface standards resource for the GunSpec SDK.
 *
 * Wraps `/v1/interfaces`: the mount vocabulary every fit is computed from
 * (`thread:1/2x28`, `mag:stanag`, `rail:picatinny`). Listing it is open;
 * asking which firearms expose a standard is Studio.
 *
 * @module
 */

import { pathSegment } from '../core/path';
import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type { InterfaceStandard, InterfaceFirearm, ListInterfacesParams, PaginationParams } from '../types';

export class InterfacesResource {
  constructor(private readonly client: HttpClient) {}

  /** Every standard the vocabulary knows, optionally one `kind` only. Answers 304. */
  async list(params?: ListInterfacesParams): Promise<APIResponse<InterfaceStandard[]>> {
    return this.client.get<InterfaceStandard[]>('/v1/interfaces', params);
  }

  /**
   * Firearms that expose a standard at some position. Studio.
   *
   * The id is URL-encoded for you: `thread:1/2x28` carries a colon and a slash
   * that would otherwise be read as path separators.
   */
  async getFirearms(id: string, params?: PaginationParams): Promise<PaginatedResponse<InterfaceFirearm>> {
    return this.client.getPaginated<InterfaceFirearm>(
      `/v1/interfaces/${pathSegment(id)}/firearms`,
      params,
    );
  }
}

/**
 * Platforms resource for the GunSpec SDK.
 *
 * Wraps `/v1/platforms`: the families (`ak-100`, `ar-15`) whose interface
 * rows every member inherits. One row on a platform reaches every firearm
 * that belongs to it, which is the lever behind most computed fits. Studio.
 *
 * @module
 */

import type { HttpClient, APIResponse } from '../core';
import type { Platform, PlatformDetail } from '../types';

export class PlatformsResource {
  constructor(private readonly client: HttpClient) {}

  /** Every platform with its member count. Answers 304. */
  async list(): Promise<APIResponse<Platform[]>> {
    return this.client.get<Platform[]>('/v1/platforms');
  }

  /** A platform's interface rows and members. Answers 304. */
  async get(id: string): Promise<APIResponse<PlatformDetail>> {
    return this.client.get<PlatformDetail>(`/v1/platforms/${encodeURIComponent(id)}`);
  }
}

/**
 * Features resource for the GunSpec SDK.
 *
 * Provides access to `/v1/features` endpoints: the drawn icon for each
 * firearm feature, as a catalogue.
 *
 * @module
 */

import type { HttpClient, PaginatedResponse } from '../core';
import type { FeatureIcon, PaginationParams } from '../types';

/** Parameters for {@link FeaturesResource.listIcons}. */
export interface ListFeatureIconsParams extends Pick<PaginationParams, 'page' | 'per_page'> {
  /** Part of an icon's name; spaces and hyphens read as underscores. */
  q?: string;
}

/**
 * Resource class for the GunSpec Features API.
 *
 * Exposed as `client.features`. A single firearm's icons are `feature_icon`
 * items in `client.firearms.listMedia(id)`; this lists them all.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 * const { data } = await client.features.listIcons({ q: 'rifling' });
 * console.log(data.map((icon) => icon.label));
 * ```
 */
export class FeaturesResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List the drawn feature icons, a page at a time. On every plan.
   *
   * @param params - Optional name filter and pagination.
   * @returns A page of icons, each with its name, label and CDN URL.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const page = await client.features.listIcons({ q: 'rifling', per_page: 50 });
   * // [{ name: '5r_rifling', label: '5R Rifling', iconUrl: 'https://assets.gunspec.io/...' }, ...]
   * ```
   */
  async listIcons(params?: ListFeatureIconsParams): Promise<PaginatedResponse<FeatureIcon>> {
    return this.client.getPaginated<FeatureIcon>('/v1/features/icons', params);
  }
}

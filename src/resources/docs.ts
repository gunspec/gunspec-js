/**
 * Docs resource for the GunSpec SDK.
 *
 * Wraps the `/v1/docs` endpoints: the API reference and the plan limits as
 * data, for code and agents that need to call GunSpec correctly. Any key,
 * Explorer included.
 *
 * @module
 */

import { pathSegment } from '../core/path';
import type { HttpClient, APIResponse } from '../core';
import type {
  DocsGuide,
  DocsGuides,
  DocsGuideSearch,
  DocsLimits,
  DocsOperations,
  DocsSamples,
  GetDocsGuideParams,
  GetDocsOperationsParams,
  GetDocsSampleParams,
  SearchDocsGuidesParams,
} from '../types';

/**
 * Resource class for the documentation endpoints.
 *
 * Instantiated internally by the {@link GunSpec} client and exposed as
 * `client.docs`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * const { data } = await client.docs.getSample({ path: '/v1/firearms', method: 'GET', language: 'python' });
 * console.log(data.samples[0]?.code);
 * ```
 */
export class DocsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Look up what the reference documents for an operation: parameters, the plan
   * it needs, caching, every failure with its `error.reason` values, and the
   * languages a sample is printed in.
   *
   * @param params - A documented template, concrete path or URL, and optionally a method.
   * @returns The matching operations.
   * @throws {NotFoundError} If nothing is documented at or under the path.
   *
   * @example
   * ```typescript
   * const { data } = await client.docs.getOperations({ path: '/v1/firearms/{id}', method: 'GET' });
   * console.log(data.operations[0]?.tier, data.operations[0]?.parameters.map((p) => p.name));
   * ```
   */
  async getOperations(params: GetDocsOperationsParams): Promise<APIResponse<DocsOperations>> {
    return this.client.get<DocsOperations>('/v1/docs/operations', params);
  }

  /**
   * Get the sample the reference prints for an operation in one language,
   * exactly as printed, with the result of the last run that checked it.
   *
   * @param params - The operation's path, its method where the path answers several, and the language.
   * @returns The sample, or one per SDK method for an SDK language.
   * @throws {NotFoundError} If the reference prints no sample in that language.
   *
   * @example
   * ```typescript
   * const { data } = await client.docs.getSample({ path: '/v1/firearms', method: 'GET', language: 'curl' });
   * console.log(data.samples[0]?.code, data.samples[0]?.verification?.status);
   * ```
   */
  async getSample(params: GetDocsSampleParams): Promise<APIResponse<DocsSamples>> {
    return this.client.get<DocsSamples>('/v1/docs/samples', params);
  }

  /**
   * What each plan allows: requests per minute, day and month, MCP calls per
   * day, paging depth, and how long to wait after a 429.
   *
   * @returns The limits the API enforces.
   *
   * @example
   * ```typescript
   * const { data } = await client.docs.getLimits();
   * for (const plan of data.plans) console.log(plan.name, plan.requestsPerMinute, plan.requestsPerDay);
   * ```
   */
  async getLimits(): Promise<APIResponse<DocsLimits>> {
    return this.client.get<DocsLimits>('/v1/docs/limits');
  }

  /**
   * Every guide the documentation renders, with the headings each is divided
   * into: what is documented, and the ids and anchors to read it by.
   *
   * @returns The guides, in the order the documentation lists them.
   *
   * @example
   * ```typescript
   * const { data } = await client.docs.listGuides();
   * for (const guide of data.guides) console.log(guide.id, guide.sections.length);
   * ```
   */
  async listGuides(): Promise<APIResponse<DocsGuides>> {
    return this.client.get<DocsGuides>('/v1/docs/guides');
  }

  /**
   * The sections of the guides that answer a question, best first.
   *
   * The entry point: search, then read the one section you need rather than a
   * whole page. A question the guides do not cover returns no results rather
   * than the nearest paragraph.
   *
   * @param params - The question, and optionally how many sections to return.
   * @returns The matching sections, each with a snippet and a link to it.
   *
   * @example
   * ```typescript
   * const { data } = await client.docs.searchGuides({ q: 'how do I handle a 429' });
   * for (const hit of data.results) console.log(hit.trail, hit.url);
   * ```
   */
  async searchGuides(params: SearchDocsGuidesParams): Promise<APIResponse<DocsGuideSearch>> {
    return this.client.get<DocsGuideSearch>('/v1/docs/guides/search', params);
  }

  /**
   * One guide as Markdown: the whole page, or with `anchor` only that heading.
   *
   * @param id - The guide's id, as {@link DocsResource.listGuides} gives it.
   * @param params - Optionally the anchor of the one section wanted.
   * @returns The guide, whole or in one section.
   * @throws {NotFoundError} If there is no such guide, or no such anchor on it.
   *
   * @example
   * ```typescript
   * const { data } = await client.docs.getGuide('caching', { anchor: 'caching-policy' });
   * console.log(data.sections[0]?.markdown);
   * ```
   */
  async getGuide(id: string, params: GetDocsGuideParams = {}): Promise<APIResponse<DocsGuide>> {
    return this.client.get<DocsGuide>(`/v1/docs/guides/${pathSegment(id)}`, params);
  }
}

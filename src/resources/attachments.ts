/**
 * Attachments resource for the GunSpec SDK.
 *
 * Wraps `/v1/attachments`. Browsing the catalog is open on the same terms as
 * `/v1/firearms`; computing fit (`fits=` on the list, `getFirearms`) is a
 * Studio feature and answers 403 `PLAN_REQUIRED` below it.
 *
 * @module
 */

import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  Attachment,
  AttachmentDetail,
  AttachmentFirearmFit,
  ListAttachmentsParams,
  OffersParams,
  PaginationParams,
  PublicOffer,
} from '../types';

/**
 * Resource class for attachments and their compatibility.
 *
 * @example
 * ```typescript
 * const client = new GunSpec();
 *
 * // What suppressors does the catalog hold?
 * const { data } = await client.attachments.list({ category: 'suppressor' });
 *
 * // What fits an AK-74M? (Studio)
 * const fits = await client.attachments.list({ fits: 'ak-74m' });
 * ```
 */
export class AttachmentsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List attachments. `fits` and `only_offered` change what the list means:
   * the first runs the fit engine, the second restricts to one seller's stock.
   */
  async list(params?: ListAttachmentsParams): Promise<PaginatedResponse<Attachment>> {
    return this.client.getPaginated<Attachment>('/v1/attachments', params);
  }

  /** Get one attachment with its requirements, provisions and caliber ratings. */
  async get(id: string): Promise<APIResponse<AttachmentDetail>> {
    return this.client.get<AttachmentDetail>(`/v1/attachments/${encodeURIComponent(id)}`);
  }

  /** List the firearms an attachment fits, with how each fit was reached. Studio. */
  async getFirearms(id: string, params?: PaginationParams): Promise<PaginatedResponse<AttachmentFirearmFit>> {
    return this.client.getPaginated<AttachmentFirearmFit>(
      `/v1/attachments/${encodeURIComponent(id)}/firearms`,
      params,
    );
  }

  /**
   * Sellers stocking this attachment. Link out through {@link VendorResource.clickUrl}
   * with each offer's `clickId` so the seller can see the visit came from you.
   */
  async getOffers(id: string, params?: OffersParams): Promise<APIResponse<PublicOffer[]>> {
    return this.client.get<PublicOffer[]>(`/v1/attachments/${encodeURIComponent(id)}/offers`, params);
  }

  /** Iterate every attachment matching the filters, fetching pages on demand. */
  async *listAutoPaging(params?: ListAttachmentsParams): AsyncIterableIterator<Attachment> {
    let page = params?.page ?? 1;
    for (;;) {
      const res = await this.list({ ...params, page });
      yield* res.data;
      const { totalPages, limit } = res.pagination;
      const more = totalPages !== undefined ? page < totalPages : res.data.length >= limit;
      if (!more) return;
      page += 1;
    }
  }
}

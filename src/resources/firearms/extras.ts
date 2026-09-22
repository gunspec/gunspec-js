/**
 * Name resolution, media, offers and compatibility helpers for the firearms
 * resource.
 *
 * Free functions taking the {@link HttpClient} first, like `single.ts`, so
 * the {@link FirearmsResource} class can delegate without growing.
 *
 * @module
 */

import type { HttpClient, APIResponse, PaginatedResponse, RawResponse } from '../../core';
import type {
  FirearmAttachments,
  FirearmAttachmentsParams,
  FirearmInterfaces,
  FirearmMedia,
  GetFirearmMediaParams,
  ImageAsset,
  ImageAssetParams,
  ListFirearmMediaParams,
  MediaCatalogItem,
  MediaCatalogParams,
  MediaKind,
  OffersParams,
  PublicOffer,
  ResolveManyResult,
  ResolveResult,
} from '../../types';

const slug = (id: string): string => `/v1/firearms/${encodeURIComponent(id)}`;

// ── Name resolution ──────────────────────────────────────────────────────

/** Resolve one free-text name (`"G19 gen 5"`) to a firearm id. Builder. */
export function resolve(client: HttpClient, q: string): Promise<APIResponse<ResolveResult>> {
  return client.get<ResolveResult>('/v1/firearms/resolve', { q });
}

/** Resolve many names in one call. Studio. */
export function resolveMany(client: HttpClient, queries: string[]): Promise<APIResponse<ResolveManyResult>> {
  return client.post<ResolveManyResult>('/v1/firearms/resolve', { queries });
}

// ── Media ────────────────────────────────────────────────────────────────

/** Every firearm that has imagery, one row each. Answers 304. */
export function mediaCatalog(client: HttpClient, params?: MediaCatalogParams): Promise<PaginatedResponse<MediaCatalogItem>> {
  return client.getPaginated<MediaCatalogItem>('/v1/firearms/media', params);
}

/** Every asset on one firearm, with credit and derivative sizes. */
export function listMedia(client: HttpClient, id: string, params?: ListFirearmMediaParams): Promise<APIResponse<FirearmMedia[]>> {
  return client.get<FirearmMedia[]>(`${slug(id)}/media`, params);
}

/**
 * Metadata for one asset. `selector` is a kind (`silhouette`, the primary of
 * that kind) or a numeric row id from {@link listMedia}. Builder.
 */
export function getMedia(
  client: HttpClient,
  id: string,
  selector: MediaKind | number | string,
  params?: GetFirearmMediaParams,
): Promise<APIResponse<FirearmMedia>> {
  return client.get<FirearmMedia>(`${slug(id)}/media/${encodeURIComponent(String(selector))}`, { ...params, format: 'json' });
}

/** The bytes of one asset, following the redirect to the CDN. Builder. */
export function downloadMedia(
  client: HttpClient,
  id: string,
  selector: MediaKind | number | string,
  params?: GetFirearmMediaParams,
): Promise<RawResponse> {
  return client.getBytes(`${slug(id)}/media/${encodeURIComponent(String(selector))}`, { ...params, format: 'raw' });
}

/** One image as a base64 data URI, for embedding without a second request. Builder. */
export function getImageAsset(
  client: HttpClient,
  id: string,
  imageId: number | string,
  params?: ImageAssetParams,
): Promise<APIResponse<ImageAsset>> {
  return client.get<ImageAsset>(`${slug(id)}/images/${encodeURIComponent(String(imageId))}`, { ...params, format: 'datauri' });
}

/** The 3D model as GLB bytes (`model/gltf-binary`). Builder. */
export function getModel(client: HttpClient, id: string): Promise<RawResponse> {
  return client.getBytes(`${slug(id)}/model`);
}

// ── Sellers ──────────────────────────────────────────────────────────────

/** Sellers stocking this firearm. */
export function getOffers(client: HttpClient, id: string, params?: OffersParams): Promise<APIResponse<PublicOffer[]>> {
  return client.get<PublicOffer[]>(`${slug(id)}/offers`, params);
}

// ── Compatibility ────────────────────────────────────────────────────────

/** The mount interfaces a firearm exposes, own rows then inherited. Studio. */
export function getInterfaces(client: HttpClient, id: string): Promise<APIResponse<FirearmInterfaces>> {
  return client.get<FirearmInterfaces>(`${slug(id)}/interfaces`);
}

/** Attachments that fit, grouped by category, with the evidence for each. Studio. */
export function getAttachments(
  client: HttpClient,
  id: string,
  params?: FirearmAttachmentsParams,
): Promise<APIResponse<FirearmAttachments>> {
  return client.get<FirearmAttachments>(`${slug(id)}/attachments`, params);
}

// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Media, name resolution and notice types
// ---------------------------------------------------------------------------

import type { MediaKind, NoticeVariant } from './vocabulary';

export type { MediaKind };

/** An image as it rides inline on a list row: id, URL, kind and dimensions. */
export interface InlineMediaItem {
  id: number;
  /** Absolute URL on the assets CDN. */
  url: string;
  kind: MediaKind;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

/** One asset on a firearm (`GET /v1/firearms/{id}/media`). */
export interface FirearmMedia {
  /** Row id, or null for an asset derived from the record itself. */
  id: number | null;
  kind: MediaKind;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  /** Absolute URL on the assets CDN. */
  url: string;
  /** Pre-rendered derivatives, where they exist. */
  sizes?: { full?: string; display?: string; thumb?: string };
  credit: {
    source: string | null;
    author: string | null;
    sourceUrl: string | null;
    license: string | null;
  };
}

/** One firearm and its imagery (`GET /v1/firearms/media`). */
export interface MediaCatalogItem {
  id: string;
  name: string;
  images: InlineMediaItem[];
}

/** Parameters for `GET /v1/firearms/media`. */
export interface MediaCatalogParams {
  page?: number;
  per_page?: number;
  /** Restrict the images on each row to one kind. */
  kind?: MediaKind;
}

/** Parameters for `GET /v1/firearms/{id}/media`. */
export interface ListFirearmMediaParams {
  kind?: MediaKind;
}

/** Parameters for `GET /v1/firearms/{id}/media/{selector}` as metadata. */
export interface GetFirearmMediaParams {
  /** Pre-rendered derivative; falls back to the original when absent. */
  size?: 'full' | 'display' | 'thumb';
  /** Silhouettes only: inject a stroke so line art reads on every background. */
  stroke_width?: number;
  /** Silhouettes only: a CSS colour the browser understands. */
  stroke_color?: string;
}

/** `GET /v1/firearms/{id}/images/{imageId}?format=datauri`. */
export interface ImageAsset {
  id: string;
  imageId: number;
  variant: 'original' | 'display' | 'thumb';
  format: 'datauri';
  mimeType: string;
  dataUri: string;
}

/** Parameters for `GET /v1/firearms/{id}/images/{imageId}`. */
export interface ImageAssetParams {
  variant?: 'original' | 'display' | 'thumb';
}

/** A near miss offered alongside a resolution. */
export interface ResolveAlternative {
  firearmId: string;
  name: string;
  manufacturerName: string | null;
  match: string;
  matchedAlias: string | null;
  score: number;
}

/** `GET /v1/firearms/resolve?q=` and each row of the batch form. */
export interface ResolveResult {
  query: string;
  /** `resolved`, `ambiguous` or `unresolved`. */
  status: string;
  firearmId: string | null;
  match: string | null;
  score: number;
  matchedTokens: string[];
  unresolvedTokens: string[];
  alternatives: ResolveAlternative[];
}

/** `POST /v1/firearms/resolve`. */
export interface ResolveManyResult {
  results: ResolveResult[];
}

/** A banner the website shows (`GET /v1/notices`). */
export interface SiteNotice {
  id: string;
  label: string;
  highlight: string;
  detail?: string;
  variant: NoticeVariant;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  priority?: number;
  startsAt?: string | null;
  endsAt?: string | null;
}

/**
 * Collection-level endpoint helpers for the firearms resource.
 *
 * These free functions implement the `/v1/firearms` collection endpoints
 * (list, search, compare, filters, and the various `by-*` filters). They
 * take the {@link HttpClient} as their first argument so the
 * {@link FirearmsResource} class can delegate to them while keeping its
 * public method signatures unchanged.
 *
 * @module
 */

import type {
  HttpClient,
  APIResponse,
  PaginatedResponse,
  Firearm,
  FirearmComparison,
  GameMetaItem,
  ActionTypeStats,
  PowerRating,
  HeadToHead,
  FilterOptions,
  ListFirearmsParams,
  SearchFirearmsParams,
  CompareFirearmsParams,
  GameMetaParams,
  RandomFirearmParams,
  TopFirearmsParams,
  HeadToHeadParams,
  ByFeatureParams,
  ByActionParams,
  ByMaterialParams,
  ByDesignerParams,
  PowerRatingParams,
  TimelineParams,
  ByConflictParams,
} from './types';

export function list(
  client: HttpClient,
  params?: ListFirearmsParams,
): Promise<PaginatedResponse<Firearm>> {
  return client.getPaginated<Firearm>('/v1/firearms', params);
}

export function search(
  client: HttpClient,
  params: SearchFirearmsParams,
): Promise<PaginatedResponse<Firearm>> {
  return client.getPaginated<Firearm>('/v1/firearms/search', params);
}

export function compare(
  client: HttpClient,
  params: CompareFirearmsParams,
): Promise<APIResponse<FirearmComparison>> {
  return client.get<FirearmComparison>('/v1/firearms/compare', params);
}

export function gameMeta(
  client: HttpClient,
  params?: GameMetaParams,
): Promise<APIResponse<GameMetaItem[]>> {
  return client.get<GameMetaItem[]>('/v1/firearms/game-meta', params);
}

export function actionTypes(client: HttpClient): Promise<APIResponse<ActionTypeStats[]>> {
  return client.get<ActionTypeStats[]>('/v1/firearms/action-types');
}

export function filterOptions(client: HttpClient): Promise<APIResponse<FilterOptions>> {
  return client.get<FilterOptions>('/v1/firearms/filter-options');
}

export function random(
  client: HttpClient,
  params?: RandomFirearmParams,
): Promise<APIResponse<Firearm>> {
  return client.get<Firearm>('/v1/firearms/random', params);
}

export function top(
  client: HttpClient,
  params: TopFirearmsParams,
): Promise<APIResponse<Firearm[]>> {
  return client.get<Firearm[]>('/v1/firearms/top', params);
}

export function headToHead(
  client: HttpClient,
  params: HeadToHeadParams,
): Promise<APIResponse<HeadToHead>> {
  return client.get<HeadToHead>('/v1/firearms/head-to-head', params);
}

export function byFeature(
  client: HttpClient,
  params: ByFeatureParams,
): Promise<PaginatedResponse<Firearm>> {
  return client.getPaginated<Firearm>('/v1/firearms/by-feature', params);
}

export function byAction(
  client: HttpClient,
  params: ByActionParams,
): Promise<PaginatedResponse<Firearm>> {
  return client.getPaginated<Firearm>('/v1/firearms/by-action', params);
}

export function byMaterial(
  client: HttpClient,
  params: ByMaterialParams,
): Promise<PaginatedResponse<Firearm>> {
  return client.getPaginated<Firearm>('/v1/firearms/by-material', params);
}

export function byDesigner(
  client: HttpClient,
  params: ByDesignerParams,
): Promise<PaginatedResponse<Firearm>> {
  return client.getPaginated<Firearm>('/v1/firearms/by-designer', params);
}

export function powerRating(
  client: HttpClient,
  params?: PowerRatingParams,
): Promise<PaginatedResponse<PowerRating>> {
  return client.getPaginated<PowerRating>('/v1/firearms/power-rating', params);
}

export function timeline(
  client: HttpClient,
  params?: TimelineParams,
): Promise<PaginatedResponse<Firearm>> {
  return client.getPaginated<Firearm>('/v1/firearms/timeline', params);
}

export function byConflict(
  client: HttpClient,
  params: ByConflictParams,
): Promise<PaginatedResponse<Firearm>> {
  return client.getPaginated<Firearm>('/v1/firearms/by-conflict', params);
}

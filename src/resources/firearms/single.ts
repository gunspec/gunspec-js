/**
 * Single-resource endpoint helpers for the firearms resource.
 *
 * These free functions implement the per-firearm endpoints
 * (`/v1/firearms/{id}` and its sub-resources). They take the
 * {@link HttpClient} as their first argument so the
 * {@link FirearmsResource} class can delegate to them while keeping its
 * public method signatures unchanged.
 *
 * @module
 */

import type {
  HttpClient,
  APIResponse,
  Firearm,
  FirearmDetail,
  FirearmImage,
  FirearmCalculation,
  FirearmLoadProfile,
  GameStats,
  Dimensions,
  FirearmUser,
  FamilyTree,
  SimilarFirearm,
  AdoptionMap,
  GameProfile,
  Silhouette,
  SilhouetteParams,
  CalculateBallisticsParams,
  LoadFirearmParams,
} from './types';

export function get(client: HttpClient, id: string): Promise<APIResponse<FirearmDetail>> {
  return client.get<FirearmDetail>(`/v1/firearms/${encodeURIComponent(id)}`);
}

export function getVariants(client: HttpClient, id: string): Promise<APIResponse<Firearm[]>> {
  return client.get<Firearm[]>(`/v1/firearms/${encodeURIComponent(id)}/variants`);
}

export function getImages(client: HttpClient, id: string): Promise<APIResponse<FirearmImage[]>> {
  return client.get<FirearmImage[]>(`/v1/firearms/${encodeURIComponent(id)}/images`);
}

export function getGameStats(client: HttpClient, id: string): Promise<APIResponse<GameStats>> {
  return client.get<GameStats>(`/v1/firearms/${encodeURIComponent(id)}/game-stats`);
}

export function getDimensions(client: HttpClient, id: string): Promise<APIResponse<Dimensions>> {
  return client.get<Dimensions>(`/v1/firearms/${encodeURIComponent(id)}/dimensions`);
}

export function getUsers(client: HttpClient, id: string): Promise<APIResponse<FirearmUser[]>> {
  return client.get<FirearmUser[]>(`/v1/firearms/${encodeURIComponent(id)}/users`);
}

export function getFamilyTree(client: HttpClient, id: string): Promise<APIResponse<FamilyTree>> {
  return client.get<FamilyTree>(`/v1/firearms/${encodeURIComponent(id)}/family-tree`);
}

export function getSimilar(client: HttpClient, id: string): Promise<APIResponse<SimilarFirearm[]>> {
  return client.get<SimilarFirearm[]>(`/v1/firearms/${encodeURIComponent(id)}/similar`);
}

export function getAdoptionMap(client: HttpClient, id: string): Promise<APIResponse<AdoptionMap>> {
  return client.get<AdoptionMap>(`/v1/firearms/${encodeURIComponent(id)}/adoption-map`);
}

export function getGameProfile(client: HttpClient, id: string): Promise<APIResponse<GameProfile>> {
  return client.get<GameProfile>(`/v1/firearms/${encodeURIComponent(id)}/game-profile`);
}

export function getSilhouette(
  client: HttpClient,
  id: string,
  params?: SilhouetteParams,
): Promise<APIResponse<Silhouette>> {
  return client.get<Silhouette>(
    `/v1/firearms/${encodeURIComponent(id)}/silhouette`,
    params,
  );
}

export function calculate(
  client: HttpClient,
  id: string,
  params: CalculateBallisticsParams,
): Promise<APIResponse<FirearmCalculation>> {
  return client.get<FirearmCalculation>(
    `/v1/firearms/${encodeURIComponent(id)}/calculate`,
    params,
  );
}

export function load(
  client: HttpClient,
  id: string,
  params?: LoadFirearmParams,
): Promise<APIResponse<FirearmLoadProfile>> {
  return client.get<FirearmLoadProfile>(
    `/v1/firearms/${encodeURIComponent(id)}/load`,
    params,
  );
}

/**
 * Shared imports for the firearms resource modules.
 *
 * Centralises the model and parameter type imports used across the
 * {@link FirearmsResource} class and its co-located endpoint helpers.
 *
 * @module
 */

export type { HttpClient, APIResponse, PaginatedResponse } from '../../core';
export type {
  Firearm,
  FirearmComparison,
  FirearmDetail,
  FirearmImage,
  FirearmCalculation,
  FirearmLoadProfile,
  GameStats,
  GameMetaItem,
  ActionTypeStats,
  Dimensions,
  FirearmUser,
  FamilyTree,
  SimilarFirearm,
  AdoptionMap,
  GameProfile,
  Silhouette,
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
  SilhouetteParams,
  CalculateBallisticsParams,
  LoadFirearmParams,
} from '../../types';

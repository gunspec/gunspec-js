/**
 * Firearms resource for the GunSpec SDK.
 *
 * Provides access to all `/v1/firearms` endpoints including listing,
 * searching, comparing, filtering, and retrieving individual firearm
 * details with sub-resources (images, variants, game stats, etc.).
 *
 * @module
 */

import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
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
  FirearmSchematic,
  PopularFirearm,
} from '../types';
import * as collection from './firearms/collection';
import * as single from './firearms/single';
import * as extras from './firearms/extras';
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
} from '../types';
import type { RawResponse } from '../core';

/**
 * Resource class for interacting with the GunSpec Firearms API.
 *
 * Wraps all `/v1/firearms` endpoints. Instantiated internally by the
 * {@link GunSpec} client and exposed as `client.firearms`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * // List firearms with filters
 * const { data, pagination } = await client.firearms.list({
 *   manufacturer: 'glock',
 *   category: 'pistol',
 *   per_page: 10,
 * });
 *
 * // Get a single firearm by slug
 * const { data: firearm } = await client.firearms.get('glock-g17');
 * ```
 */
export class FirearmsResource {
  constructor(private readonly client: HttpClient) {}

  // ---------------------------------------------------------------------------
  // Collection endpoints
  // ---------------------------------------------------------------------------

  /**
   * List firearms with optional filters and pagination.
   *
   * @param params - Optional query parameters for filtering, sorting, and pagination.
   * @returns A paginated list of firearms matching the given filters.
   * @throws {BadRequestError} If any filter value is invalid.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.firearms.list({
   *   manufacturer: 'beretta',
   *   status: 'in_production',
   *   sort: 'name',
   *   order: 'asc',
   *   page: 1,
   *   per_page: 25,
   * });
   * console.log(result.data); // Firearm[]
   * console.log(result.pagination.totalPages);
   * ```
   */
  async list(params?: ListFirearmsParams): Promise<PaginatedResponse<Firearm>> {
    return collection.list(this.client, params);
  }

  /**
   * Auto-paginate through all firearms matching the given filters.
   *
   * Returns an async iterator that fetches pages on demand, yielding
   * individual {@link Firearm} objects. Useful for processing large
   * result sets without managing pagination manually.
   *
   * @param params - Optional query parameters for filtering and sorting.
   * @returns An async iterable iterator yielding individual firearms.
   *
   * @example
   * ```typescript
   * let seen = 0;
   * for await (const firearm of client.firearms.listAutoPaging({ manufacturer: 'colt' })) {
   *   console.log(firearm.name);
   *   // Drop this to walk the whole collection.
   *   if (++seen >= 5) break;
   * }
   * ```
   */
  async *listAutoPaging(params?: ListFirearmsParams): AsyncIterableIterator<Firearm> {
    let page = params?.page ?? 1;
    while (true) {
      const result = await this.list({ ...params, page });
      for (const item of result.data) {
        yield item;
      }
      if (!result.pagination.totalPages || page >= result.pagination.totalPages) break;
      page++;
    }
  }

  /**
   * Full-text search across firearms.
   *
   * @param params - Search query and pagination parameters.
   * @returns A paginated list of firearms matching the search query.
   * @throws {BadRequestError} If the search query is empty or too long.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.firearms.search({ q: '9mm compact' });
   * console.log(result.data.length);
   * ```
   */
  async search(params: SearchFirearmsParams): Promise<PaginatedResponse<Firearm>> {
    return collection.search(this.client, params);
  }

  /**
   * Compare up to 5 firearms side by side.
   *
   * @param params - Object containing comma-separated firearm IDs.
   * @returns An array of firearms with full details for comparison.
   * @throws {BadRequestError} If more than 5 IDs are provided or any ID is invalid.
   * @throws {NotFoundError} If any of the specified firearms do not exist.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.compare({ ids: 'glock-g17,sig-sauer-p320-full-size,beretta-92fs' });
   * console.log(data.items.length); // 3
   * ```
   */
  async compare(params: CompareFirearmsParams): Promise<APIResponse<FirearmComparison>> {
    return collection.compare(this.client, params);
  }

  /**
   * Retrieve game metadata for firearms (archetypes, stat ranges, etc.).
   *
   * @param params - Optional archetype filter.
   * @returns Game metadata including archetype definitions and stat ranges.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.gameMeta({ archetype: 'sniper' });
   * ```
   */
  async gameMeta(params?: GameMetaParams): Promise<APIResponse<GameMetaItem[]>> {
    return collection.gameMeta(this.client, params);
  }

  /**
   * List all known action types across the database.
   *
   * @returns An array of distinct action type strings.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.actionTypes();
   * // ['Semi-automatic', 'Bolt action', 'Lever action', ...]
   * ```
   */
  async actionTypes(): Promise<APIResponse<ActionTypeStats[]>> {
    return collection.actionTypes(this.client);
  }

  /**
   * Get available filter options for the firearms list endpoint.
   *
   * Returns distinct values for manufacturers, calibers, categories,
   * action types, countries, and statuses that can be used as filter values.
   *
   * @returns An object mapping filter fields to their available values.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.filterOptions();
   * console.log(data.manufacturers); // ['beretta', 'colt', ...]
   * console.log(data.categories);    // ['pistol', 'rifle', ...]
   * ```
   */
  async filterOptions(): Promise<APIResponse<FilterOptions>> {
    return collection.filterOptions(this.client);
  }

  /**
   * Get a random firearm, optionally filtered by category or country.
   *
   * @param params - Optional category and country filters.
   * @returns A single randomly selected firearm.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.random({ category: 'pistol' });
   * console.log(data.name);
   * ```
   */
  async random(params?: RandomFirearmParams): Promise<APIResponse<Firearm>> {
    return collection.random(this.client, params);
  }

  /**
   * Get top firearms ranked by a specific statistic.
   *
   * @param params - The stat to rank by and optional category/limit filters.
   * @returns An ordered array of firearms ranked by the specified stat.
   * @throws {BadRequestError} If the stat value is not a recognized ranking metric.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.top({
   *   stat: 'lightest',
   *   category: 'pistol',
   *   limit: 5,
   * });
   * ```
   */
  async top(params: TopFirearmsParams): Promise<APIResponse<Firearm[]>> {
    return collection.top(this.client, params);
  }

  /**
   * Compare two firearms in a head-to-head matchup.
   *
   * @param params - The slugs of the two firearms to compare.
   * @returns A detailed head-to-head comparison with per-stat breakdowns.
   * @throws {NotFoundError} If either firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.headToHead({ a: 'glock-g17', b: 'sig-sauer-p320-full-size' });
   * console.log(data.winner);
   * ```
   */
  async headToHead(params: HeadToHeadParams): Promise<APIResponse<HeadToHead>> {
    return collection.headToHead(this.client, params);
  }

  /**
   * Filter firearms by a specific feature.
   *
   * @param params - The feature name and optional category filter with pagination.
   * @returns A paginated list of firearms that have the specified feature.
   * @throws {BadRequestError} If the feature name is empty.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.firearms.byFeature({ feature: 'threaded-barrel' });
   * ```
   */
  async byFeature(params: ByFeatureParams): Promise<PaginatedResponse<Firearm>> {
    return collection.byFeature(this.client, params);
  }

  /**
   * Filter firearms by action type.
   *
   * @param params - The action type string with pagination.
   * @returns A paginated list of firearms with the specified action type.
   * @throws {BadRequestError} If the action type is empty.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.firearms.byAction({ action: 'short_recoil' });
   * ```
   */
  async byAction(params: ByActionParams): Promise<PaginatedResponse<Firearm>> {
    return collection.byAction(this.client, params);
  }

  /**
   * Filter firearms by frame/component material.
   *
   * @param params - The material name, component type, and pagination.
   * @returns A paginated list of firearms using the specified material.
   * @throws {BadRequestError} If the material or component is invalid.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.firearms.byMaterial({
   *   material: 'polymer',
   *   component: 'frame',
   * });
   * ```
   */
  async byMaterial(params: ByMaterialParams): Promise<PaginatedResponse<Firearm>> {
    return collection.byMaterial(this.client, params);
  }

  /**
   * Filter firearms by designer name.
   *
   * @param params - The designer name string with pagination.
   * @returns A paginated list of firearms designed by the specified person.
   * @throws {BadRequestError} If the designer name is empty.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.firearms.byDesigner({ designer: 'John Browning' });
   * ```
   */
  async byDesigner(params: ByDesignerParams): Promise<PaginatedResponse<Firearm>> {
    return collection.byDesigner(this.client, params);
  }

  /**
   * Get firearms ranked by computed power rating.
   *
   * @param params - Optional category filter with pagination.
   * @returns A paginated list of firearms with their power ratings.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.firearms.powerRating({ category: 'rifle' });
   * for (const item of result.data) {
   *   console.log(`${item.name}: ${item.rating}`);
   * }
   * ```
   */
  async powerRating(params?: PowerRatingParams): Promise<PaginatedResponse<PowerRating>> {
    return collection.powerRating(this.client, params);
  }

  /**
   * Get firearms arranged in a chronological timeline.
   *
   * @param params - Optional year range, category filter, and pagination.
   * @returns A paginated list of firearms ordered by introduction date.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.firearms.timeline({ from: 1900, to: 1950 });
   * ```
   */
  async timeline(params?: TimelineParams): Promise<PaginatedResponse<Firearm>> {
    return collection.timeline(this.client, params);
  }

  /**
   * Filter firearms by military conflict.
   *
   * @param params - The conflict identifier string with pagination.
   * @returns A paginated list of firearms used in the specified conflict.
   * @throws {BadRequestError} If the conflict name is empty.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const result = await client.firearms.byConflict({ conflict: 'world-war-ii' });
   * ```
   */
  async byConflict(params: ByConflictParams): Promise<PaginatedResponse<Firearm>> {
    return collection.byConflict(this.client, params);
  }

  // ---------------------------------------------------------------------------
  // Single-resource endpoints
  // ---------------------------------------------------------------------------

  /**
   * Get a single firearm by its slug or ID.
   *
   * @param id - The firearm slug (e.g. `"glock-g17"`) or numeric ID.
   * @returns The full firearm record with all available fields.
   * @throws {NotFoundError} If no firearm matches the given identifier.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.get('beretta-92fs');
   * console.log(data.name);            // "Beretta 92FS"
   * console.log(data.manufacturerId);  // "beretta"
   * ```
   */
  async get(id: string): Promise<APIResponse<FirearmDetail>> {
    return single.get(this.client, id);
  }

  /**
   * Get all variants of a firearm.
   *
   * @param id - The parent firearm slug or ID.
   * @returns An array of variant firearms derived from the parent.
   * @throws {NotFoundError} If the parent firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getVariants('ak-47');
   * console.log(data.map(v => v.name));
   * ```
   */
  async getVariants(id: string): Promise<APIResponse<Firearm[]>> {
    return single.getVariants(this.client, id);
  }

  /**
   * Get images for a firearm.
   *
   * @param id - The firearm slug or ID.
   * @returns An array of image records with URLs, dimensions, and metadata.
   * @throws {NotFoundError} If the firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getImages('glock-17-gen5');
   * for (const img of data) {
   *   console.log(img.url, img.width, img.height);
   * }
   * ```
   */
  async getImages(id: string): Promise<APIResponse<FirearmImage[]>> {
    return single.getImages(this.client, id);
  }

  /**
   * Get computed game statistics for a firearm.
   *
   * @param id - The firearm slug or ID.
   * @returns Game-balanced stats including damage, accuracy, range, etc.
   * @throws {NotFoundError} If the firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getGameStats('ak-47');
   * console.log(data.damage, data.accuracy, data.range);
   * ```
   */
  async getGameStats(id: string): Promise<APIResponse<GameStats>> {
    return single.getGameStats(this.client, id);
  }

  /**
   * Get physical dimensions for a firearm.
   *
   * @param id - The firearm slug or ID.
   * @returns Detailed dimension data (length, height, width, barrel length, weight).
   * @throws {NotFoundError} If the firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getDimensions('glock-g19');
   * console.log(`${data.overallLengthMm}mm overall`);
   * ```
   */
  async getDimensions(id: string): Promise<APIResponse<Dimensions>> {
    return single.getDimensions(this.client, id);
  }

  /**
   * Get known military/law-enforcement adopters of a firearm.
   *
   * @param id - The firearm slug or ID.
   * @returns An array of users/adopters with country and organization data.
   * @throws {NotFoundError} If the firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getUsers('ak-74');
   * for (const user of data) {
   *   console.log(user.country, user.organization);
   * }
   * ```
   */
  async getUsers(id: string): Promise<APIResponse<FirearmUser[]>> {
    return single.getUsers(this.client, id);
  }

  /**
   * Get the family tree (lineage) of a firearm.
   *
   * @param id - The firearm slug or ID.
   * @returns A tree structure showing predecessors, descendants, and related models.
   * @throws {NotFoundError} If the firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getFamilyTree('m16a2');
   * console.log(data.ancestors, data.descendants);
   * ```
   */
  async getFamilyTree(id: string): Promise<APIResponse<FamilyTree>> {
    return single.getFamilyTree(this.client, id);
  }

  /**
   * Get firearms similar to a given firearm.
   *
   * @param id - The firearm slug or ID.
   * @returns An array of similar firearms ranked by similarity score.
   * @throws {NotFoundError} If the firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getSimilar('glock-g17');
   * for (const match of data) {
   *   console.log(match.name, match.similarityScore);
   * }
   * ```
   */
  async getSimilar(id: string): Promise<APIResponse<SimilarFirearm[]>> {
    return single.getSimilar(this.client, id);
  }

  /**
   * Get the worldwide adoption map for a firearm.
   *
   * @param id - The firearm slug or ID.
   * @returns Adoption data by country with usage type and date ranges.
   * @throws {NotFoundError} If the firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getAdoptionMap('fn-fal');
   * console.log(data.countries.length, 'countries adopted this firearm');
   * ```
   */
  async getAdoptionMap(id: string): Promise<APIResponse<AdoptionMap>> {
    return single.getAdoptionMap(this.client, id);
  }

  /**
   * Get the full game profile for a firearm.
   *
   * @param id - The firearm slug or ID.
   * @returns Game-specific profile including archetype, tier, and stat breakdown.
   * @throws {NotFoundError} If the firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getGameProfile('hk-mp5');
   * console.log(data.archetype, data.tier);
   * ```
   */
  async getGameProfile(id: string): Promise<APIResponse<GameProfile>> {
    return single.getGameProfile(this.client, id);
  }

  /**
   * Get an SVG silhouette (line art) of a firearm.
   *
   * @param id - The firearm slug or ID.
   * @param params - Optional format and stroke customization parameters.
   * @returns Silhouette data in the requested format (raw SVG, data URI, or JSON).
   * @throws {NotFoundError} If the firearm does not exist or has no silhouette.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getSilhouette('ak-47', {
   *   format: 'datauri',
   *   stroke_width: 2,
   *   stroke_color: '#333',
   * });
   * // Use data.dataUri in an <img> tag
   * ```
   */
  async getSilhouette(id: string, params?: SilhouetteParams): Promise<APIResponse<Silhouette>> {
    return single.getSilhouette(this.client, id, params);
  }

  /**
   * Calculate ballistics for a firearm with specific ammunition.
   *
   * @param id - The firearm slug or ID.
   * @param params - Ammunition ID and optional ballistic parameters.
   * @returns Calculated ballistic data including velocity, energy, and trajectory.
   * @throws {NotFoundError} If the firearm or ammunition does not exist.
   * @throws {BadRequestError} If the ammunition is incompatible with the firearm.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.calculate('glock-g17', {
   *   ammo_id: 'federal-hst-124jhp',
   * });
   * console.log(data.muzzleVelocity, data.muzzleEnergy);
   * ```
   */
  async calculate(id: string, params: CalculateBallisticsParams): Promise<APIResponse<FirearmCalculation>> {
    return single.calculate(this.client, id, params);
  }

  /**
   * Load a firearm with ammunition and get combined performance data.
   *
   * @param id - The firearm slug or ID.
   * @param params - Optional ammunition ID to load.
   * @returns Combined firearm + ammunition data with computed performance metrics.
   * @throws {NotFoundError} If the firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.load('sig-sauer-p226', {
   *   ammo_id: 'federal-hst-124jhp',
   * });
   * ```
   */
  async load(id: string, params?: LoadFirearmParams): Promise<APIResponse<FirearmLoadProfile>> {
    return single.load(this.client, id, params);
  }

  /**
   * Get the technical schematics for a firearm.
   *
   * Returns exploded-view and cutaway drawings with their attribution.
   *
   * @param id - The firearm slug or ID.
   * @returns The schematics on file, or an empty array if none exist.
   * @throws {NotFoundError} If the firearm does not exist.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.getSchematics('ak-47');
   * for (const s of data) console.log(s.title, s.imageUrl);
   * ```
   */
  async getSchematics(id: string): Promise<APIResponse<FirearmSchematic[]>> {
    return this.client.get<FirearmSchematic[]>(
      `/v1/firearms/${encodeURIComponent(id)}/schematics`,
    );
  }

  /**
   * List the most viewed firearms over a trailing window.
   *
   * @param params - Optional window (`days`, max 30) and result count (`limit`, max 20).
   * @returns Firearms ranked by recorded view activity.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.popular({ days: 7, limit: 5 });
   * console.log(data.map((f) => f.name));
   * ```
   */
  async popular(params?: { days?: number; limit?: number }): Promise<APIResponse<PopularFirearm[]>> {
    return this.client.get<PopularFirearm[]>('/v1/popular/firearms', params);
  }

  // ---------------------------------------------------------------------------
  // Name resolution
  // ---------------------------------------------------------------------------

  /**
   * Resolve a free-text name to a firearm id. Builder.
   *
   * @example
   * ```typescript
   * const { data } = await client.firearms.resolve('G19 gen 5');
   * if (data.status === 'resolved') console.log(data.firearmId);
   * ```
   */
  async resolve(q: string): Promise<APIResponse<ResolveResult>> {
    return extras.resolve(this.client, q);
  }

  /** Resolve many names in one request. Studio. */
  async resolveMany(queries: string[]): Promise<APIResponse<ResolveManyResult>> {
    return extras.resolveMany(this.client, queries);
  }

  // ---------------------------------------------------------------------------
  // Media
  // ---------------------------------------------------------------------------

  /** Every firearm that has imagery, one row each. */
  async mediaCatalog(params?: MediaCatalogParams): Promise<PaginatedResponse<MediaCatalogItem>> {
    return extras.mediaCatalog(this.client, params);
  }

  /** Every asset on a firearm, with credit and derivative sizes. */
  async listMedia(id: string, params?: ListFirearmMediaParams): Promise<APIResponse<FirearmMedia[]>> {
    return extras.listMedia(this.client, id, params);
  }

  /** Metadata for one asset, by kind or by row id. Builder. */
  async getMedia(id: string, selector: MediaKind | number | string, params?: GetFirearmMediaParams): Promise<APIResponse<FirearmMedia>> {
    return extras.getMedia(this.client, id, selector, params);
  }

  /** The bytes of one asset, following the redirect to the CDN. Builder. */
  async downloadMedia(id: string, selector: MediaKind | number | string, params?: GetFirearmMediaParams): Promise<RawResponse> {
    return extras.downloadMedia(this.client, id, selector, params);
  }

  /**
   * One image as a base64 data URI. Builder.
   *
   * **Ask for a variant.** A data URI is capped at 256 KB and a catalogue
   * original is routinely five times that, so the default request fails on
   * exactly the images most worth embedding. `thumb` and `display` are
   * generated derivatives and always fit; `original` is for the cases where
   * you know the file is small. For the full-size bytes use
   * {@link downloadMedia}, which redirects to the CDN and has no such cap.
   *
   * @param id - The firearm slug or ID.
   * @param imageId - The image row id, from {@link getImages}.
   * @param params - `variant`: `thumb`, `display` or `original`.
   * @returns The image as a base64 data URI, with its media type and size.
   * @throws {BadRequestError} If the encoded image exceeds the 256 KB cap.
   * @throws {NotFoundError} If the firearm or image does not exist.
   *
   * @example
   * ```typescript
   * // The id comes from getImages() on the same firearm: it is a row id, not
   * // something to memorise.
   * const { data } = await client.firearms.getImageAsset('glock-17-gen5', 6563, {
   *   variant: 'thumb',
   * });
   * console.log(data.dataUri.slice(0, 32), data.mimeType);
   * ```
   */
  async getImageAsset(id: string, imageId: number | string, params?: ImageAssetParams): Promise<APIResponse<ImageAsset>> {
    return extras.getImageAsset(this.client, id, imageId, params);
  }

  /** The 3D model as GLB bytes. Builder. */
  async getModel(id: string): Promise<RawResponse> {
    return extras.getModel(this.client, id);
  }

  // ---------------------------------------------------------------------------
  // Sellers and compatibility
  // ---------------------------------------------------------------------------

  /** Sellers stocking this firearm; link out through `client.vendor.clickUrl(offer.clickId)`. */
  async getOffers(id: string, params?: OffersParams): Promise<APIResponse<PublicOffer[]>> {
    return extras.getOffers(this.client, id, params);
  }

  /** The mount interfaces a firearm exposes. Studio. */
  async getInterfaces(id: string): Promise<APIResponse<FirearmInterfaces>> {
    return extras.getInterfaces(this.client, id);
  }

  /** Attachments that fit, grouped by category, with the evidence for each. Studio. */
  async getAttachments(id: string, params?: FirearmAttachmentsParams): Promise<APIResponse<FirearmAttachments>> {
    return extras.getAttachments(this.client, id, params);
  }
}

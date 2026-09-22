/**
 * Game resource for the GunSpec SDK.
 *
 * Provides access to all `/v1/game` endpoints for game-balanced
 * firearm data including balance reports, tier lists, matchups,
 * role rosters, and stat distributions.
 *
 * @module
 */

import type { HttpClient, APIResponse } from '../core';
import type {
  BalanceEntry,
  TierList,
  MatchupResult,
  RoleRosterItem,
  StatDistribution,
  BalanceReportParams,
  TierListParams,
  MatchupsParams,
  RoleRosterParams,
  StatDistributionParams,
} from '../types';

/**
 * Resource class for interacting with the GunSpec Game API.
 *
 * Wraps all `/v1/game` endpoints. These endpoints provide game-balanced
 * firearm data suitable for game development, including normalized stats,
 * tier rankings, and balance analysis.
 *
 * Instantiated internally by the {@link GunSpec} client and exposed as
 * `client.game`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * const { data } = await client.game.tierList({ stat: 'damage' });
 * console.log(data.tiers);
 * ```
 */
export class GameResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Get a balance report showing outlier firearms.
   *
   * Identifies firearms whose game stats deviate significantly from
   * the average, useful for game balancing.
   *
   * @param params - Optional threshold for outlier detection (0-100).
   * @returns A balance report with overpowered and underpowered firearms.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.game.balanceReport({ threshold: 15 });
   * console.log(data.length, 'firearms flagged as outliers');
   * ```
   */
  async balanceReport(params?: BalanceReportParams): Promise<APIResponse<BalanceEntry[]>> {
    return this.client.get<BalanceEntry[]>('/v1/game/balance-report', params);
  }

  /**
   * Get a tier list of firearms ranked by a specific stat.
   *
   * @param params - Optional category filter and stat to rank by.
   * @returns A tier list with firearms grouped into S/A/B/C/D/F tiers.
   * @throws {BadRequestError} If the stat is not a valid game stat.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.game.tierList({
   *   stat: 'accuracy',
   *   category: 'rifle',
   * });
   * console.log('S-tier:', data.tiers.S.map(f => f.name));
   * ```
   */
  async tierList(params?: TierListParams): Promise<APIResponse<TierList>> {
    return this.client.get<TierList>('/v1/game/tier-list', params);
  }

  /**
   * Get a game-balanced matchup between two firearms.
   *
   * @param params - The slugs of the two firearms to compare.
   * @returns A detailed matchup result with per-stat comparisons and a winner.
   * @throws {NotFoundError} If either firearm does not exist.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.game.matchups({ a: 'ak-47', b: 'm4-carbine' });
   * console.log(data.winner, data.statComparisons);
   * ```
   */
  async matchups(params: MatchupsParams): Promise<APIResponse<MatchupResult>> {
    return this.client.get<MatchupResult>('/v1/game/matchups', params);
  }

  /**
   * Get a roster of firearms best suited for a specific game role.
   *
   * @param params - The role to query and optional count limit.
   * @returns A roster of firearms ranked by suitability for the given role.
   * @throws {BadRequestError} If the role is not a recognized game role.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.game.roleRoster({
   *   role: 'sniper',
   *   count: 10,
   * });
   * for (const firearm of data) {
   *   console.log(firearm.name, firearm.roleScore);
   * }
   * ```
   */
  async roleRoster(params: RoleRosterParams): Promise<APIResponse<RoleRosterItem[]>> {
    return this.client.get<RoleRosterItem[]>('/v1/game/role-roster', params);
  }

  /**
   * Get the statistical distribution for a specific game stat.
   *
   * Shows how firearms are distributed across value ranges for a given
   * stat, useful for understanding the spread and identifying balance issues.
   *
   * @param params - The stat to analyze (e.g. `"damage"`, `"accuracy"`).
   * @returns Distribution data including histogram buckets and summary statistics.
   * @throws {BadRequestError} If the stat is not a valid game stat.
   * @throws {AuthenticationError} If the API key is missing or invalid.
   *
   * @example
   * ```typescript
   * const { data } = await client.game.statDistribution({ stat: 'damage' });
   * console.log(data.mean, data.median, data.buckets);
   * ```
   */
  async statDistribution(params: StatDistributionParams): Promise<APIResponse<StatDistribution>> {
    return this.client.get<StatDistribution>('/v1/game/stat-distribution', params);
  }
}

// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Request parameters: game
// ---------------------------------------------------------------------------
import type { PaginationParams } from './shared';

// ── Game ───────────────────────────────────────────────────────────────────

/**
 * Parameters for `GET /v1/game/balance`.
 */
export interface BalanceReportParams {
  /**
   * Z-score threshold for flagging outliers (0-100).
   * @defaultValue `20`
   */
  threshold?: number;
}

/**
 * Parameters for `GET /v1/game/tier-list`.
 */
export interface TierListParams {
  /** Optional category filter. */
  category?: string;
  /**
   * Stat to rank by.
   * @defaultValue `"damage"`
   */
  stat?: 'damage' | 'accuracy' | 'range' | 'fireRate' | 'mobility' | 'recoilControl' | 'reloadSpeed' | 'concealment';
}

/**
 * Parameters for `GET /v1/game/matchups`.
 */
export interface MatchupsParams {
  /** Slug of firearm A. */
  a: string;
  /** Slug of firearm B. */
  b: string;
}

/**
 * Parameters for `GET /v1/game/role-roster`.
 */
export interface RoleRosterParams {
  /** The role to build a roster for. */
  role: 'sniper' | 'assault' | 'tank' | 'support' | 'stealth' | 'speedster';
  /**
   * Number of firearms to return (1-25).
   * @defaultValue `5`
   */
  count?: number;
}

/**
 * Parameters for `GET /v1/game/stat-distribution`.
 */
export interface StatDistributionParams {
  /** The game stat to analyse. */
  stat: 'damage' | 'accuracy' | 'range' | 'fireRate' | 'mobility' | 'recoilControl' | 'reloadSpeed' | 'concealment';
}

// ── Game Stats Snapshots ───────────────────────────────────────────────────

/**
 * Parameters for `GET /v1/game-stats/:version/firearms`.
 */
export interface ListSnapshotFirearmsParams extends PaginationParams {}

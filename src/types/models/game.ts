// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: game
// ---------------------------------------------------------------------------

// ── Game Stats ─────────────────────────────────────────────────────────────

/**
 * Extracted game statistics for a firearm (0-100 scale per stat).
 *
 * Used in game-related endpoints.
 */
export interface GameStats {
  /** Damage rating (0-100). */
  damage: number | null;
  /** Accuracy rating (0-100). */
  accuracy: number | null;
  /** Range rating (0-100). */
  range: number | null;
  /** Fire rate rating (0-100). */
  fireRate: number | null;
  /** Mobility rating (0-100). */
  mobility: number | null;
  /** Recoil control rating (0-100). */
  recoilControl: number | null;
  /** Reload speed rating (0-100). */
  reloadSpeed: number | null;
  /** Concealment rating (0-100). */
  concealment: number | null;
}

/**
 * Firearm game profile including archetype classification.
 *
 * Returned by `GET /v1/firearms/:id/game/profile`.
 */
export interface GameProfile {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Damage rating (0-100). */
  gameDamage: number | null;
  /** Accuracy rating (0-100). */
  gameAccuracy: number | null;
  /** Range rating (0-100). */
  gameRange: number | null;
  /** Fire rate rating (0-100). */
  gameFireRate: number | null;
  /** Mobility rating (0-100). */
  gameMobility: number | null;
  /** Recoil control rating (0-100). */
  gameRecoilControl: number | null;
  /** Reload speed rating (0-100). */
  gameReloadSpeed: number | null;
  /** Concealment rating (0-100). */
  gameConcealment: number | null;
  /** Computed archetype classification. */
  archetype: string;
  /** List of stat-based strengths. */
  strengths: string[];
  /** List of stat-based weaknesses. */
  weaknesses: string[];
}

/**
 * A firearm in the game meta listing.
 *
 * Returned by `GET /v1/firearms/:id/game/meta`.
 */
export interface GameMetaItem {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Computed archetype. */
  archetype: string;
  gameDamage: number | null;
  gameAccuracy: number | null;
  gameRange: number | null;
  gameFireRate: number | null;
  gameMobility: number | null;
  gameRecoilControl: number | null;
  gameReloadSpeed: number | null;
  gameConcealment: number | null;
}

// ── Game Endpoints ─────────────────────────────────────────────────────────

/**
 * Balance report entry flagging statistical outliers.
 *
 * Returned by `GET /v1/game/balance`.
 */
export interface BalanceEntry {
  /** Firearm slug. */
  firearmId: string;
  /** Firearm name. */
  firearmName: string;
  /** Stat deviations that exceeded the threshold. */
  deviations: BalanceDeviation[];
}

/**
 * A single stat deviation in a balance report.
 */
export interface BalanceDeviation {
  /** Stat key (e.g. `"damage"`, `"accuracy"`). */
  stat: string;
  /** The firearm's value for this stat. */
  value: number;
  /** Population mean for this stat. */
  mean: number;
  /** Population standard deviation for this stat. */
  stdDev: number;
  /** Z-score (how many std devs from the mean). */
  zScore: number;
}

/**
 * Tier list grouping for a single game stat.
 *
 * Returned by `GET /v1/game/tier-list`.
 */
export interface TierList {
  /** The stat used for ranking. */
  stat: string;
  /** Firearms grouped into S/A/B/C/D tiers. */
  tiers: {
    S: TierItem[];
    A: TierItem[];
    B: TierItem[];
    C: TierItem[];
    D: TierItem[];
  };
}

/**
 * An item within a tier.
 */
export interface TierItem {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Category slug. */
  categoryId: string | null;
  /** Stat value. */
  value: number;
}

/**
 * Game matchup result comparing two firearms' game stats.
 *
 * Returned by `GET /v1/game/matchups`.
 */
export interface MatchupResult {
  /** Firearm A summary with stats. */
  a: { id: string; name: string; stats: GameStats };
  /** Firearm B summary with stats. */
  b: { id: string; name: string; stats: GameStats };
  /** Per-stat verdict: which firearm wins each category. */
  verdicts: Record<string, 'a' | 'b' | 'draw'>;
  /** Number of stats won by A. */
  aWins: number;
  /** Number of stats won by B. */
  bWins: number;
  /** Number of drawn stats. */
  draws: number;
}

/**
 * A firearm in a role roster.
 *
 * Returned by `GET /v1/game/role-roster`.
 */
export interface RoleRosterItem {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Weighted score for the requested role. */
  roleScore: number;
  /** Full game stats. */
  stats: GameStats;
}

/**
 * Stat distribution / histogram for a single game stat.
 *
 * Returned by `GET /v1/game/stat-distribution`.
 */
export interface StatDistribution {
  /** The stat analysed. */
  stat: string;
  /** Number of firearms with this stat. */
  count: number;
  /** Arithmetic mean. */
  mean: number;
  /** Median value. */
  median: number;
  /** Standard deviation. */
  stdDev: number;
  /** Minimum value. */
  min: number;
  /** Maximum value. */
  max: number;
  /** Key percentiles. */
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  /** 10-bucket histogram (0-10, 10-20, ..., 90-100). */
  histogram: Array<{ bucket: string; count: number }>;
}

// ── Game Stats Snapshots ───────────────────────────────────────────────────

/**
 * A versioned snapshot of game stats for all firearms.
 *
 * Returned by `GET /v1/game-stats/versions`.
 */
export interface GameStatsVersion {
  /** Auto-increment ID. */
  readonly id: number;
  /** Version identifier (e.g. `"1.0.0"`). */
  version: string;
  /** Description of the snapshot. */
  description?: string | null;
  /** Number of firearms in this snapshot. */
  firearmCount: number;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
}

/**
 * A single entry in a game-stats snapshot.
 */
export interface GameStatsSnapshotEntry {
  /** Auto-increment ID. */
  readonly id: number;
  /** Snapshot ID. */
  snapshotId: number;
  /** Firearm slug. */
  firearmId: string;
  /** Firearm name at time of snapshot. */
  firearmName: string;
  gameDamage: number | null;
  gameAccuracy: number | null;
  gameRange: number | null;
  gameFireRate: number | null;
  gameMobility: number | null;
  gameRecoilControl: number | null;
  gameReloadSpeed: number | null;
  gameConcealment: number | null;
}

// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: catalog
// ---------------------------------------------------------------------------
import type { Provenance } from './provenance';
import type { FirearmStatus } from '../vocabulary';

// ── Manufacturers ──────────────────────────────────────────────────────────

/**
 * A firearms manufacturer.
 *
 * @example
 * ```ts
 * const glock: Manufacturer = {
 *   id: 'glock',
 *   name: 'Glock',
 *   countryCode: 'AT',
 *   foundedYear: 1963,
 *   createdAt: '2024-01-01T00:00:00',
 *   updatedAt: '2024-01-01T00:00:00',
 * };
 * ```
 */
export interface Manufacturer {
  /** URL-safe slug identifier. */
  readonly id: string;
  /** Display name. */
  name: string;
  /** ISO 3166-1 alpha-2 country code. */
  countryCode?: string | null;
  /** Year the company was founded. */
  foundedYear?: number | null;
  /** Whether the company still trades: `active`, `defunct`, or `unknown` where no source settles it. */
  status?: 'active' | 'defunct' | 'unknown' | null;
  /** Year the company ceased trading, where established. Null while it trades, and where the year is unknown. */
  defunctYear?: number | null;
  /** Government owned. Null is not false: it means nobody has established it. */
  stateOwned?: boolean | null;
  /** Builds the products the catalog lists, as against importing or rebranding them. Null where unknown. */
  makesFirearms?: boolean | null;
  /** The manufacturer that owns this one today. */
  parentId?: string | null;
  /** The manufacturer this one succeeded, which is not the same as being owned by it. */
  predecessorId?: string | null;
  /** Company website URL. */
  website?: string | null;
  /** URL to the company logo. */
  logoUrl?: string | null;
  /** Long-form description. */
  description?: string | null;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
  /** When the served columns last changed. */
  readonly updatedAt: string;
  /** Content hash; equal versions mean equal data. */
  readonly version: string | null;
}

/**
 * Per-manufacturer aggregate statistics.
 *
 * Returned by `GET /v1/manufacturers/:id/stats`.
 */
export interface ManufacturerStats {
  /** The manufacturer summary. */
  manufacturer: { id: string; name: string };
  /** Aggregate statistics. */
  stats: {
    total_firearms: number;
    avg_weight_g: number | null;
    avg_range_m: number | null;
    avg_capacity: number | null;
    active_count: number;
    discontinued_count: number;
    earliest_year: number | null;
    latest_year: number | null;
  } | null;
  /** Breakdown by category. */
  categories: Array<{ id: string; name: string; count: number }>;
  /** The most common caliber among this manufacturer's firearms. */
  mostCommonCaliber: { id: string; name: string; count: number } | null;
}

/**
 * Manufacturer timeline grouping firearms by year introduced.
 *
 * Returned by `GET /v1/manufacturers/:id/timeline`.
 */
export interface ManufacturerTimeline {
  /** The manufacturer summary. */
  manufacturer: { id: string; name: string };
  /** Firearms grouped by year. */
  timeline: Array<{
    year: number | null;
    firearms: Array<{
      id: string;
      name: string;
      yearIntroduced: number | null;
      categoryId: string;
      status: FirearmStatus | null;
    }>;
  }>;
}

// ── Calibers ───────────────────────────────────────────────────────────────

/** The outline the cartridge illustration is drawn with. `none` is caseless or a blank. */
export type CaseShape = 'straight' | 'tapered' | 'bottleneck' | 'none';
export type CaseMaterial = 'brass' | 'nickel_brass' | 'steel' | 'lacquered_steel' | 'aluminium' | 'polymer' | 'paper' | 'caseless' | 'none';
/** `none` is a blank; `closure` says what seals the mouth instead. */
export type ProjectileKind = 'bullet' | 'none' | 'shot' | 'slug' | 'round_ball' | 'flechette' | 'dart' | 'pellet' | 'rocket' | 'grenade' | 'signal';
export type BulletProfile = 'spitzer' | 'spitzer_boat_tail' | 'round_nose' | 'flat_nose' | 'wadcutter' | 'semi_wadcutter' | 'hollow_point' | 'truncated_cone' | 'round_ball';
/** What seals the case mouth. */
export type Closure = 'bullet' | 'star_crimp' | 'rosette_crimp' | 'roll_crimp' | 'fold_crimp' | 'wad' | 'paper' | 'none';
/** The paint a load is bought by: crimp lacquer on a blank, tip colour on a military-only round. */
export type MarkingColor = 'black' | 'white' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'brown' | 'grey' | 'silver' | 'gold';
/** Which body's drawing the dimensions follow. */
export type SpecStandard = 'saami' | 'cip' | 'nato' | 'proprietary' | 'none';

/**
 * A cartridge / caliber specification.
 *
 * @example
 * ```ts
 * const nato556: Caliber = {
 *   id: '5-56x45mm-nato',
 *   name: '5.56x45mm NATO',
 *   cartridgeType: 'centerfire_rifle',
 *   bulletDiameterMm: 5.70,
 *   createdAt: '2024-01-01T00:00:00',
 *   updatedAt: '2024-01-01T00:00:00',
 * };
 * ```
 */
export interface Caliber {
  /** URL-safe slug identifier. */
  readonly id: string;
  /** Display name. */
  name: string;
  /** Other names this cartridge is sold or written as. */
  aliases?: string[] | null;
  /** NATO designation (e.g. `"5.56x45mm NATO"`). */
  natoDesignation?: string | null;
  /** Bullet diameter in millimetres. */
  bulletDiameterMm?: number | null;
  /** Neck diameter in millimetres. */
  neckDiameterMm?: number | null;
  /** Shoulder diameter in millimetres (bottleneck cases). */
  shoulderDiameterMm?: number | null;
  /** Base diameter in millimetres. */
  baseDiameterMm?: number | null;
  /** Rim diameter in millimetres. */
  rimDiameterMm?: number | null;
  /** Rim thickness in millimetres. */
  rimThicknessMm?: number | null;
  /** Case length in millimetres. */
  caseLengthMm?: number | null;
  /** Overall cartridge length in millimetres. */
  overallLengthMm?: number | null;
  /** Bullet length in millimetres. */
  bulletLengthMm?: number | null;
  /** Maximum chamber pressure in megapascals. */
  maxPressureMpa?: number | null;
  /** Maximum chamber pressure in PSI. */
  maxPressurePsi?: number | null;
  /** Typical bullet weight in grams. */
  typicalBulletWeightG?: number | null;
  /** Typical muzzle velocity in m/s. */
  typicalMuzzleVelocityMps?: number | null;
  /** Typical muzzle energy in joules. */
  typicalMuzzleEnergyJ?: number | null;
  /** Primer type (e.g. `"Boxer"`, `"Berdan"`). */
  primerType?: string | null;
  /** Cartridge type (e.g. `"centerfire_rifle"`, `"rimfire"`). */
  cartridgeType?: string | null;
  caseShape?: CaseShape | null;
  caseMaterial?: CaseMaterial | null;
  /** `none` is a blank; `closure` says what seals the mouth instead. */
  projectileKind?: ProjectileKind | null;
  bulletProfile?: BulletProfile | null;
  closure?: Closure | null;
  /** Null for an ordinary sporting cartridge. */
  markingColor?: MarkingColor | null;
  /** What the marking colour signifies. */
  markingMeaning?: string | null;
  /** Slug of the parent cartridge, if this is a derivative. */
  parentCartridgeId?: string | null;
  /** Year the cartridge was introduced. */
  yearIntroduced?: number | null;
  /** Cartridge designer. */
  designer?: string | null;
  /** The page the drawing dimensions were read from. */
  specSource?: string | null;
  specStandard?: SpecStandard | null;
  /** 0 to 1, set from what was actually sourced. */
  dataConfidence?: number | null;
  /** ISO-8601 timestamp of the last check against a source; null means seed model knowledge. */
  verifiedAt?: string | null;
  /** The fields the source stated. Also in `provenance.verifiedFields`. */
  verifiedFields?: string[] | null;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
  /** When the served columns last changed. */
  readonly updatedAt: string;
  /** Content hash; equal versions mean equal data. */
  readonly version: string | null;
  /** Sources, confidence and verification state. */
  provenance?: Provenance;
}

/**
 * Simplified ballistics result from `GET /v1/calibers/:id/ballistics`.
 */
export interface CaliberBallistics {
  /** Caliber summary. */
  caliber: { id: string; name: string };
  /** Distance in metres used for the calculation. */
  distanceM: number;
  /** Muzzle velocity in m/s. */
  muzzleVelocityMps: number;
  /** Muzzle energy in joules. */
  muzzleEnergyJ: number;
  /** Velocity at the specified distance in m/s. */
  velocityAtDistanceMps: number;
  /** Energy at the specified distance in joules. */
  energyAtDistanceJ: number;
  /** Time of flight to the distance in seconds. */
  timeOfFlightS: number;
  /** Bullet drop at the distance in centimetres. */
  bulletDropCm: number;
}

/**
 * Caliber family tree (ancestors + current + descendants).
 *
 * Returned by `GET /v1/calibers/:id/family`.
 */
export interface CaliberFamily {
  /** Ancestor cartridges ordered from most distant to immediate parent. */
  ancestors: Caliber[];
  /** The requested caliber. */
  current: Caliber;
  /** Descendant / derived cartridges. */
  descendants: Caliber[];
}

// ── Categories ─────────────────────────────────────────────────────────────

/**
 * A firearm category (e.g. "pistol", "sniper-rifle").
 */
export interface Category {
  /** URL-safe slug identifier. */
  readonly id: string;
  /** Display name. */
  name: string;
  /** Long-form description. */
  description?: string | null;
}

// ── Countries ──────────────────────────────────────────────────────────────

/**
 * A country with its firearm count.
 *
 * Returned by `GET /v1/countries`.
 */
export interface Country {
  /** ISO 3166-1 alpha-2 country code. */
  code: string;
  /** Number of firearms originating from this country. */
  firearmCount: number;
}

// ── Conflicts ──────────────────────────────────────────────────────────────

/**
 * A conflict with associated firearms.
 *
 * Returned by `GET /v1/conflicts`.
 */
export interface Conflict {
  /** Conflict name. */
  name: string;
  /** Number of firearms used in this conflict. */
  firearmCount: number;
  /** Firearms used in this conflict. */
  firearms: Array<{ id: string; name: string }>;
}

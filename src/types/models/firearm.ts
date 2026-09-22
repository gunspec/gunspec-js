// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: firearm
// ---------------------------------------------------------------------------
import type { Category, Manufacturer } from './catalog';
import type { Provenance } from './provenance';
import type { FirearmSchematic } from './account';
import type { FirearmImage, FirearmUser } from './firearm-relations';
import type { InlineMediaItem } from '../media';
import type { FirearmStatus } from '../vocabulary';
import type { BulletProfile, CaseMaterial, CaseShape, Closure, MarkingColor, ProjectileKind } from './catalog';

// ── Firearms ───────────────────────────────────────────────────────────────

/**
 * A firearm specification record.
 *
 * The full detail shape is returned by `GET /v1/firearms/:id`.
 * List endpoints return a subset of these fields.
 *
 * @example
 * ```ts
 * const glock: Firearm = {
 *   id: 'glock-g17',
 *   name: 'Glock G17',
 *   manufacturerId: 'glock',
 *   categoryId: 'pistol',
 *   status: 'in_production',
 *   yearIntroduced: 1982,
 *   countryOfOrigin: 'AT',
 *   actionType: 'short_recoil',
 * };
 * ```
 */
/** One conflict a firearm saw service in. */
export interface FirearmConflict {
  name: string;
  /** When it ran, as written: `'1955-1975'`, `'2001-present'`. */
  years: string;
  /** The belligerents. */
  sides: string[];
}

/** How many of a firearm were made, and over what period. */
export interface FirearmProductionNumbers {
  estimated_total?: number | null;
  production_years?: string | null;
  notes?: string | null;
}

export interface Firearm {
  /** URL-safe slug identifier (e.g. `"glock-g17"`). */
  readonly id: string;
  /** Display name of the firearm. */
  name: string;
  /** Slug of the manufacturer (FK to {@link Manufacturer.id}). */
  manufacturerId: string;
  /** Slug of the category (FK to {@link Category.id}). */
  categoryId: string;
  /** Slug of the parent firearm when this is a variant. */
  parentFirearmId?: string | null;
  /** Free-text label describing the variant relationship (e.g. `"compact"`, `"tactical"`). */
  variantType?: string | null;
  /** Year the firearm was first produced. */
  yearIntroduced?: number | null;
  /** Year production ended, if applicable. */
  yearDiscontinued?: number | null;
  /** Current production status. */
  status?: FirearmStatus | null;
  /** ISO 3166-1 alpha-2 country code of origin (e.g. `"US"`, `"AT"`). */
  countryOfOrigin?: string | null;

  // ── Physical dimensions ────────────────────────────────────────────────

  /** Empty weight in grams. */
  weightEmptyG?: number | null;
  /** Loaded weight in grams. */
  weightLoadedG?: number | null;
  /** Overall length in millimetres. */
  overallLengthMm?: number | null;
  /** Barrel length in millimetres. */
  barrelLengthMm?: number | null;
  /** Height in millimetres. */
  heightMm?: number | null;
  /** Width in millimetres. */
  widthMm?: number | null;
  /** Sight radius in millimetres. */
  sightRadiusMm?: number | null;
  /** Folded/collapsed length in millimetres, if applicable. */
  foldedLengthMm?: number | null;

  // ── Mechanical characteristics ─────────────────────────────────────────

  /** Action type slug (e.g. `"short_recoil"`, `"gas_operated"`). */
  actionType?: string | null;
  /** Firing mechanism description. */
  firingMechanism?: string | null;
  /** Trigger type (e.g. `"single_action"`, `"double_action"`). */
  triggerType?: string | null;
  /** Trigger pull force in newtons. */
  triggerPullN?: number | null;
  /** Standard magazine capacity in rounds. */
  magazineCapacity?: number | null;
  /** Magazine type description. */
  magazineType?: string | null;

  // ── Ballistic performance ──────────────────────────────────────────────

  /** Muzzle velocity in metres per second. */
  muzzleVelocityMps?: number | null;
  /** Muzzle energy in joules. */
  muzzleEnergyJ?: number | null;
  /** Effective range in metres. */
  effectiveRangeM?: number | null;
  /** Maximum range in metres. */
  maxRangeM?: number | null;
  /** Cyclic rate of fire in rounds per minute. */
  rateOfFireRpm?: number | null;

  // ── Barrel details ─────────────────────────────────────────────────────

  /** Barrel rifling description (e.g. `"polygonal"`, `"conventional"`). */
  barrelRifling?: string | null;
  /** Rifling twist rate in millimetres per revolution. */
  riflingTwistMm?: number | null;
  /** Number of rifling grooves. */
  numberOfGrooves?: number | null;

  // ── Materials & finish ─────────────────────────────────────────────────

  /** Frame/receiver material. */
  frameMaterial?: string | null;
  /** Slide material. */
  slideMaterial?: string | null;
  /** Barrel material. */
  barrelMaterial?: string | null;
  /** Stock material. */
  stockMaterial?: string | null;
  /** Surface finish description. */
  finish?: string | null;

  // ── Stored as JSON text in D1, served as the value it represents ───────
  //
  // These were handed out as strings for the caller to parse. A cell that does
  // not parse is `null` rather than the raw text: the declared type is an
  // array, and a string in its place reads as a bug in the caller's code.

  /** Safety mechanisms the design carries. */
  safetyMechanisms?: string[] | null;
  /** Notable features of the design. */
  features?: string[] | null;
  /** How the firearm is fed. */
  feedSystems?: string[] | null;
  /** Other names and designations the same firearm is known by. */
  alternateNames?: string[] | null;
  /** Firing modes the selector offers, e.g. `['semi_automatic','full_automatic']`. */
  firingModes?: string[] | null;
  /** Conflicts the firearm saw service in. */
  conflicts?: FirearmConflict[] | null;
  /** How many were made, and over what period. */
  productionNumbers?: FirearmProductionNumbers | null;
  /** Source URLs the record was compiled from. Also in `provenance.sources`. */
  sources?: string[] | null;

  // ── Game stats (0-100 scale) ───────────────────────────────────────────

  /** Game damage rating (0-100). */
  gameDamage?: number | null;
  /** Game accuracy rating (0-100). */
  gameAccuracy?: number | null;
  /** Game range rating (0-100). */
  gameRange?: number | null;
  /** Game fire rate rating (0-100). */
  gameFireRate?: number | null;
  /** Game mobility rating (0-100). */
  gameMobility?: number | null;
  /** Game recoil control rating (0-100). */
  gameRecoilControl?: number | null;
  /** Game reload speed rating (0-100). */
  gameReloadSpeed?: number | null;
  /** Game concealment rating (0-100). */
  gameConcealment?: number | null;

  // ── Content & meta ─────────────────────────────────────────────────────

  /** Long-form description / history. */
  description?: string | null;
  /** Editorial notes. */
  notes?: string | null;
  /** Firearm designer(s). */
  designer?: string | null;
  /** Historical lore / trivia text. */
  lore?: string | null;

  // ── Ballistic source fields (raw manufacturer / reference data) ────────

  /** Source-reported muzzle velocity in m/s. */
  sourceMuzzleVelocityMps?: number | null;
  /** Source-reported muzzle energy in joules. */
  sourceMuzzleEnergyJ?: number | null;
  /** Source-reported effective range in metres. */
  sourceEffectiveRangeM?: number | null;
  /** Source-reported maximum range in metres. */
  sourceMaxRangeM?: number | null;
  /** Ballistics data source name. */
  ballisticsSource?: string | null;
  /** URL for ballistics data source. */
  ballisticsSourceUrl?: string | null;
  /** Default ammunition load slug. */
  defaultAmmoId?: string | null;

  // ── Media ──────────────────────────────────────────────────────────────

  /** Whether a 3-D model is available (`0` or `1`). */
  has3dModel?: number;
  /** URL to the SVG line-art silhouette. */
  svgLineArtUrl?: string | null;
  /** URL to the 3-D model asset (glTF / GLB). */
  model3dUrl?: string | null;

  // ── Data quality ───────────────────────────────────────────────────────

  /** Confidence score for the data (0.0 - 1.0). */
  dataConfidence?: number | null;

  // ── Timestamps ─────────────────────────────────────────────────────────

  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
  /** When the served columns last changed. A change signal, never a freshness one. */
  readonly updatedAt: string;
  /** Content hash; equal versions mean equal data, on every plan. */
  readonly version: string | null;
  /** Sources, confidence and verification state. Present on the detail endpoint. */
  provenance?: Provenance;
}

/**
 * Summarised firearm returned by list / search endpoints.
 *
 * This is the shape returned by `GET /v1/firearms` and
 * `GET /v1/firearms/search`.
 */
export interface FirearmListItem {
  /** URL-safe slug identifier. */
  readonly id: string;
  /** Display name. */
  name: string;
  /** Manufacturer slug. */
  manufacturerId: string;
  /** Category slug. */
  categoryId: string;
  /** Year introduced. */
  yearIntroduced?: number | null;
  /** Production status. */
  status?: FirearmStatus | null;
  /** Country of origin ISO code. */
  countryOfOrigin?: string | null;
  /** Action type slug. */
  actionType?: string | null;
  /** Empty weight in grams. */
  weightEmptyG?: number | null;
  /** Barrel length in mm. */
  barrelLengthMm?: number | null;
  /** Imagery, as absolute URLs. */
  images?: InlineMediaItem[];
  /** SVG line-art URL. */
  svgLineArtUrl?: string | null;
  /** 3-D model URL. */
  model3dUrl?: string | null;
  /** ISO-8601 creation timestamp. */
  readonly createdAt?: string;
  /** Number of users who favorited this firearm. */
  favoriteCount?: number;
  /** When the served columns last changed. On every plan. */
  readonly updatedAt: string;
  /** Content hash; equal versions mean equal data. On every plan. */
  readonly version: string | null;
}

/**
 * Full firearm detail including related entities.
 *
 * Returned by `GET /v1/firearms/:id`.
 */
export interface FirearmDetail extends Firearm {
  /** The manufacturer record, or null when the id resolves to nothing. */
  manufacturer: Manufacturer | null;
  /** The category record, or null when the id resolves to nothing. */
  category: Category | null;
  /** Calibers this firearm chambers. */
  calibers: FirearmCaliberEntry[];
  /** Associated images. */
  images: FirearmImage[];
  /** Known military / law-enforcement users. */
  users: FirearmUser[];
  /** Technical drawings and documents. Studio and above; absent on lower plans. */
  schematics?: FirearmSchematic[];
}

/**
 * A caliber entry on a firearm detail, joined from the junction table.
 */
export interface FirearmCaliberEntry {
  /** Caliber slug. */
  caliberId: string;
  /** Whether this is the primary chambering (`1`) or alternate (`0`). */
  isPrimary: number;
  /** Caliber display name. */
  name: string;
  /** NATO designation, if any. */
  natoDesignation?: string | null;
  /** Bullet diameter in mm. */
  bulletDiameterMm?: number | null;
  /** Case length in mm. */
  caseLengthMm?: number | null;
  /** Cartridge type (e.g. `"centerfire_rifle"`, `"rimfire"`). */
  cartridgeType?: string | null;
  neckDiameterMm?: number | null;
  shoulderDiameterMm?: number | null;
  baseDiameterMm?: number | null;
  rimDiameterMm?: number | null;
  rimThicknessMm?: number | null;
  overallLengthMm?: number | null;
  bulletLengthMm?: number | null;
  typicalBulletWeightG?: number | null;
  primerType?: string | null;
  caseShape?: CaseShape | null;
  caseMaterial?: CaseMaterial | null;
  /** `none` is a blank; `closure` says what seals the mouth instead. */
  projectileKind?: ProjectileKind | null;
  bulletProfile?: BulletProfile | null;
  closure?: Closure | null;
  markingColor?: MarkingColor | null;
}

/**
 * A firearm variant summary.
 *
 * Returned by `GET /v1/firearms/:id/variants`.
 */
export interface FirearmVariant {
  /** Variant slug. */
  readonly id: string;
  /** Variant display name. */
  name: string;
  /** Variant relationship type. */
  variantType?: string | null;
  /** Year introduced. */
  yearIntroduced?: number | null;
  /** Production status. */
  status?: FirearmStatus | null;
}

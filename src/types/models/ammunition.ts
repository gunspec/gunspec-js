// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: ammunition
// ---------------------------------------------------------------------------

import type { Provenance } from './provenance';

// ── Ammunition ─────────────────────────────────────────────────────────────

/**
 * A specific ammunition load for a caliber.
 *
 * @example
 * ```ts
 * const m855: Ammunition = {
 *   id: 'm855-62gr-fmj',
 *   caliberId: '5-56x45mm-nato',
 *   name: 'M855 62gr FMJ',
 *   bulletWeightG: 4.02,
 *   bulletType: 'FMJ',
 *   referenceVelocityMps: 940,
 *   referenceBarrelLengthMm: 508,
 *   isCommon: 1,
 *   createdAt: '2024-01-01T00:00:00',
 *   updatedAt: '2024-01-01T00:00:00',
 * };
 * ```
 */
export interface Ammunition {
  /** URL-safe slug identifier. */
  readonly id: string;
  /** Caliber slug (FK to {@link Caliber.id}). */
  caliberId: string;
  /** Display name. */
  name: string;
  /** Military / NATO designation. */
  designation?: string | null;
  /** Ammunition manufacturer name. */
  manufacturer?: string | null;
  /** Country of origin ISO code. */
  countryOfOrigin?: string | null;
  /** Bullet weight in grams. */
  bulletWeightG: number;
  /** Bullet construction type (e.g. `"FMJ"`, `"JHP"`, `"AP"`). */
  bulletType: string;
  /** G1 ballistic coefficient (imperial). */
  ballisticCoefficientG1?: number | null;
  /** G7 ballistic coefficient (imperial). */
  ballisticCoefficientG7?: number | null;
  /** Reference muzzle velocity in m/s (measured from the reference barrel). */
  referenceVelocityMps: number;
  /** Barrel length in mm at which the reference velocity was measured. */
  referenceBarrelLengthMm: number;
  /** Exponent for velocity-vs-barrel-length power-law model. */
  velocityRetentionExponent?: number | null;
  /** Sectional density (lb/in^2). */
  sectionalDensity?: number | null;
  /** Long-form description. */
  description?: string | null;
  /** Year the load was introduced. */
  yearIntroduced?: number | null;
  /** Whether this is a common / widely-available load (`0` or `1`). */
  isCommon: number;
  /** Whether this is a military load (`0` or `1`). */
  isMilitary: number;
  /** Absolute URL of the bullet drawing, where one exists. */
  bulletSvgUrl?: string | null;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
  /** ISO-8601 last-update timestamp. */
  readonly updatedAt: string;
  /**
   * Where the figures came from. Null on every load today: nothing is cited
   * yet, so check a velocity against the maker until it is filled.
   */
  sources?: string[] | null;
  /**
   * How well specified the load is, 0 to 1, on the same scale as a firearm's.
   * Null until there are sources behind it.
   */
  dataConfidence?: number | null;
  /** Sources, confidence and verification state. */
  provenance?: Provenance;
  /**
   * Opaque fingerprint of the record; equal values mean equal data. Null when
   * the record has not been written since versioning began.
   */
  version?: string | null;
}

/**
 * A single point along a ballistic trajectory.
 *
 * Computed by the ammunition ballistics engine.
 */
export interface TrajectoryPoint {
  /** Distance from the muzzle in metres. */
  distanceM: number;
  /** Velocity at this distance in m/s. */
  velocityMps: number;
  /** Kinetic energy at this distance in joules. */
  energyJ: number;
  /** Bullet drop at this distance in centimetres. */
  dropCm: number;
  /** Time of flight to this distance in seconds. */
  timeOfFlightS: number;
  /** Mach number at this distance. */
  machNumber: number;
  /** Momentum at this distance in kg*m/s. */
  momentumKgMs: number;
  /** Taylor Knock-Out factor at this distance. */
  tkoFactor: number;
  /** Energy density at this distance in J/cm^2. */
  energyDensityJCm2: number;
}

/**
 * Muzzle-level terminal ballistics summary.
 */
export interface TerminalBallistics {
  /** Taylor Knock-Out factor. */
  tkoFactor: number;
  /** Momentum in kg*m/s. */
  momentumKgMs: number;
  /** Sectional density (lb/in^2). */
  sectionalDensity: number;
  /** Hatcher Relative Stopping Power. */
  hatcherRSP: number;
  /** Energy density in J/cm^2. */
  energyDensityJCm2: number;
}

/**
 * Full ballistic profile for an ammunition load.
 *
 * Returned by `GET /v1/ammunition/:id/ballistics`.
 */
export interface BallisticProfile {
  /** Ammunition summary. */
  ammunition: { id: string; name: string; caliberId: string };
  /** Barrel length used for calculations in mm. */
  barrelLengthMm: number;
  /** Calculated muzzle velocity in m/s. */
  muzzleVelocityMps: number;
  /** Calculated muzzle energy in joules. */
  muzzleEnergyJ: number;
  /** Calculated effective range in metres. */
  effectiveRangeM: number;
  /** Terminal ballistics at the muzzle. */
  terminalBallistics: TerminalBallistics;
  /** Trajectory drop table at specified distances. */
  trajectory: TrajectoryPoint[];
}

/**
 * Firearm ballistic calculation result.
 *
 * Returned by `GET /v1/firearms/:id/calculate`.
 */
export interface FirearmCalculation {
  /** Firearm summary. */
  firearm: { id: string; name: string; barrelLengthMm?: number | null };
  /** Ammunition summary (absent when barrel length is unavailable). */
  ammunition?: { id: string; name: string };
  /** Calculated values. */
  calculated?: {
    muzzleVelocityMps: number;
    muzzleEnergyJ: number;
    terminalBallistics: TerminalBallistics;
  };
  /** Source-reported values from the firearm record. */
  sourceReported?: {
    muzzleVelocityMps: number | null;
    muzzleEnergyJ: number | null;
  };
  /** Delta between calculated and source-reported values. */
  delta?: {
    velocityMps: number | null;
    energyJ: number | null;
  };
  /** Error message when calculation cannot be performed. */
  error?: string;
}

/**
 * Firearm load profile including full trajectory.
 *
 * Returned by `GET /v1/firearms/:id/load`.
 */
export interface FirearmLoadProfile {
  /** Firearm summary. */
  firearm: { id: string; name: string; barrelLengthMm?: number | null };
  /** Ammunition details (absent on error). */
  ammunition?: {
    id: string;
    name: string;
    caliberId: string;
    bulletWeightG: number;
    bulletType: string;
  };
  /** Calculated ballistic values. */
  calculated?: {
    muzzleVelocityMps: number;
    muzzleEnergyJ: number;
    effectiveRangeM: number;
    terminalBallistics: TerminalBallistics;
  };
  /** Source-reported values from the firearm record. */
  sourceReported?: {
    muzzleVelocityMps: number | null;
    muzzleEnergyJ: number | null;
    effectiveRangeM: number | null;
  };
  /** Trajectory drop table. */
  trajectory?: TrajectoryPoint[];
  /** Error message when calculation cannot be performed. */
  error?: string;
}

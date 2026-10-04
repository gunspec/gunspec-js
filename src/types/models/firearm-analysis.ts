// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: firearm-analysis
// ---------------------------------------------------------------------------
import type { Caliber } from './catalog';
import type { Firearm, FirearmDetail } from './firearm';

// ── Firearm Comparisons ────────────────────────────────────────────────────

/**
 * Comparison result for multiple firearms.
 *
 * Returned by `GET /v1/firearms/compare`.
 */
export interface FirearmComparison {
  /** Full detail records for each compared firearm. */
  items: FirearmDetail[];
  /** One row per field whose value differs, in the order the API ranks them. */
  deltas: FirearmComparisonDelta[];
}

/** How one field differs across the compared firearms. */
export interface FirearmComparisonDelta {
  /** The field, named as the record names it, e.g. `weightEmptyG`. */
  field: string;
  /** The field on each firearm, in the order `items` lists them. Null where a record does not carry it. */
  values: Array<number | null>;
  /** Lowest value across the firearms. Null when fewer than two carry the field. */
  min: number | null;
  /** Highest value across the firearms. Null when fewer than two carry the field. */
  max: number | null;
  /** Spread as a percentage of the lowest value. Null when it cannot be computed. */
  percentDiff: number | null;
}

/**
 * Comparison result for multiple calibers.
 *
 * Returned by `GET /v1/calibers/compare`.
 */
export interface CaliberComparison {
  /** Full caliber records. */
  items: Caliber[];
  /** Per-field deltas between the compared calibers. */
  deltas: Record<string, unknown>;
}

// ── Load Carriage ──────────────────────────────────────────────────────────

/** A paper a load-carriage equation or one of its constants is quoted from. */
export interface LoadCarriageCitation {
  /** Authors as the paper lists them. */
  authors: string;
  /** Year of publication. */
  year: number;
  /** Title of the paper. */
  title: string;
  /** Journal, volume, issue and pages. */
  journal: string;
  /** Digital Object Identifier. Null where the paper has none. */
  doi: string | null;
}

/** The equation behind every figure in a load-carriage answer. */
export interface LoadCarriageMethod {
  /** The model the costs were computed with: `lcda` or `pandolf`. */
  id: string;
  /** The model by name. */
  name: string;
  /** The equation as written, with its units, so the figures can be reproduced. */
  equation: string;
  /** Where the equation and its constants are from. */
  citations: LoadCarriageCitation[];
  /** The range the equation was fitted on, each as `[lowest, highest]`. Null for a model whose paper states none. */
  validated: { speedMps: number[]; loadFraction: number[] } | null;
}

/** The march every firearm was costed on, defaults filled in. */
export interface LoadCarriageMarch {
  /** Soldier body mass in kg. */
  bodyMassKg: number;
  /** Body fat as a percentage of body mass. */
  bodyFatPct: number;
  /** Other equipment carried, in kg. */
  kitKg: number;
  /** Full magazines carried in total. */
  magazines: number;
  /** Marching speed in km/h. */
  speedKmh: number;
  /** Marching speed in m/s, as the equations read it. */
  speedMps: number;
  /** Slope as a percentage. */
  gradePct: number;
  /** Surface id, one of {@link LoadCarriageTerrain}. */
  terrain: string;
  /** The terrain factor the moving cost is multiplied by. */
  terrainFactor: number;
  /** March distance in km. */
  distanceKm: number;
  /** How long the march takes at this speed, in seconds. */
  durationS: number;
  /** The query parameters not sent, answered from their defaults. */
  defaulted: string[];
}

/** What one march costs: the rate, and the energy over the whole distance. */
export interface LoadCarriageCost {
  /** Metabolic rate while marching, in watts, resting rate included. */
  watts: number;
  /** The same rate per kilogram of body mass. */
  wattsPerKg: number;
  /** Energy the whole march costs, in kilojoules. */
  energyKj: number;
  /** The same energy in kilocalories. */
  energyKcal: number;
}

/** One firearm's load and what marching with it costs. */
export interface LoadCarriageResult {
  /** The firearm this result is for. */
  firearm: { id: string; name: string; magazineType: string | null; magazineCapacity: number | null };
  /** What is carried, piece by piece, in grams unless named otherwise. */
  load: {
    /** Empty weight, from the record. */
    firearmEmptyG: number | null;
    /** What one full magazine adds: loaded weight less empty weight. */
    loadedMagazineG: number | null;
    /** Full magazines counted. */
    magazines: number;
    /** All the full magazines together. */
    magazinesG: number | null;
    /** All the attachments together. */
    attachmentsG: number;
    /** The firearm, its magazines and its attachments. */
    carriedG: number | null;
    /** Everything carried, kit included, in kg. */
    totalLoadKg: number | null;
    /** The total load as a share of body mass. */
    loadFraction: number | null;
    /** Where each firearm mass came from: the record as written, or arithmetic on two of its figures. */
    sources: {
      firearmEmptyG: 'catalogue' | 'derived' | null;
      loadedMagazineG: 'catalogue' | 'derived' | null;
    };
  };
  /** What the march costs with this firearm. Null when a mass it needs is not recorded; `error` says which. */
  cost: LoadCarriageCost | null;
  /**
   * Against the option with the lightest carried load. Null on that option,
   * on a lone firearm, and where no cost could be computed.
   */
  delta: { carriedG: number; watts: number; energyKj: number; energyKcal: number } | null;
  /** Where an input lies outside the fitted range, or a count needs qualifying. */
  warnings: string[];
  /** Why this firearm could not be costed. Null when it was. */
  error: string | null;
}

/**
 * The metabolic cost of a foot march with each firearm.
 *
 * Returned by `GET /v1/firearms/load-carriage`. Energy expenditure only:
 * neither model predicts fatigue, marksmanship or time to exhaustion.
 */
export interface LoadCarriageComparison {
  /** The equation behind every figure. */
  model: LoadCarriageMethod;
  /** The march every firearm was costed on. */
  march: LoadCarriageMarch;
  /** The attachments added to every firearm, with their recorded weight in grams. */
  attachments: Array<{ id: string; name: string; weightG: number }>;
  /** One result per firearm, in the order their ids were given. */
  results: LoadCarriageResult[];
}

// ── Recoil, point-blank and ammunition load ────────────────────────────────

/** A source a method or one of its constants is quoted from: a paper, a standard or a technical sheet. */
export interface AnalysisCitation {
  /** Authors or the issuing body. */
  authors: string;
  /** Year of publication or revision. */
  year: number;
  /** Title. */
  title: string;
  /** Where it is published: journal, publisher or document number. */
  journal: string;
  /** Digital Object Identifier. Null where it has none. */
  doi: string | null;
  /** A page it can be read at, where it has no DOI. */
  url: string | null;
}

/** The firearm a recoil or point-blank result is for. */
export interface AnalysisFirearm {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Category slug. */
  categoryId: string;
  /** Barrel length in mm, from the record. */
  barrelLengthMm: number | null;
}

/** The load a result fired: the one named by `ammo_id`, or the one the firearm's ballistic profile uses. */
export interface AnalysisAmmunition {
  /** Ammunition slug. */
  id: string;
  /** Load name. */
  name: string;
  /** Cartridge slug. */
  caliberId: string;
  /** Bullet mass in grams, from the load record. */
  bulletWeightG: number;
}

/** A shot's free recoil, in SI units. */
export interface FreeRecoil {
  /** Momentum the firearm takes, in newton seconds. */
  impulseNs: number;
  /** The bullet's share of it. */
  bulletImpulseNs: number;
  /** The powder gas's share. Null when it was not counted. */
  gasImpulseNs: number | null;
  /** Free recoil velocity in m/s. */
  velocityMps: number;
  /** Free recoil energy in joules. */
  energyJ: number;
  /** True when the gas was not counted, so the real recoil is larger. */
  lowerBound: boolean;
}

/** One firearm's free recoil firing a load. */
export interface RecoilResult {
  /** The firearm this result is for. */
  firearm: AnalysisFirearm;
  /** The load fired. Null when there is none. */
  ammunition: AnalysisAmmunition | null;
  /** The mass that recoils. */
  mass: { firearmG: number | null; basis: 'loaded' | 'empty' | null; source: 'catalogue' | null };
  /** The load's muzzle velocity from this firearm's barrel, in m/s. */
  muzzleVelocityMps: number | null;
  /** The powder gas term. */
  gas: {
    /** The SAAMI class applied. Null when none applies. */
    class: 'rifle' | 'shotgun' | 'shotgun_long_barrel' | 'handgun' | null;
    /** The class as SAAMI names it. */
    label: string | null;
    /** Its gas velocity factor, as a multiple of the muzzle velocity. */
    factor: number | null;
    /** The gas velocity counted, in m/s. Null when the gas was not counted. */
    velocityMps: number | null;
    /** The powder charge counted, in grams. */
    chargeG: number | null;
    /** Whether the class was named in the query or read from the category. */
    classSource: 'query' | 'category' | null;
  };
  /** The free recoil. Null when a figure it needs is not recorded; `error` says which. */
  recoil: FreeRecoil | null;
  /** Against the option with the least recoil energy. Null on that option, on a lone firearm, and where none was computed. */
  delta: { energyJ: number; velocityMps: number; impulseNs: number } | null;
  /** What an answer assumed in place of a missing figure, or why the gas was not counted. */
  warnings: string[];
  /** Why this firearm could not be answered. Null when it was. */
  error: string | null;
}

/**
 * The free recoil of each firearm firing a load, by SAAMI's formula.
 *
 * Returned by `GET /v1/firearms/recoil`. Without a powder charge every figure
 * is a lower bound. Free recoil, not felt recoil.
 */
export interface RecoilComparison {
  /** The formula behind every figure. */
  method: {
    id: string;
    name: string;
    /** The equation as written, with its units. */
    equation: string;
    citations: AnalysisCitation[];
    /** SAAMI's gas velocity factor for each class. */
    gasFactors: { rifle: number; shotgun: number; shotgun_long_barrel: number; handgun: number };
  };
  /** The shot every firearm was answered for. */
  shot: {
    mass: 'loaded' | 'empty';
    /** The powder charge given, in grams. Null when none was. */
    powderChargeG: number | null;
    /** The class given in the query. Null when each firearm's came from its category. */
    gasClass: 'rifle' | 'shotgun' | 'shotgun_long_barrel' | 'handgun' | null;
    /** True when no powder charge was given, so every figure is a lower bound. */
    lowerBound: boolean;
    /** The query parameters not sent, answered from their defaults. */
    defaulted: string[];
  };
  /** One result per firearm, in the order their ids were given. */
  results: RecoilResult[];
}

/** One firearm's maximum point-blank and supersonic range. */
export interface PointBlankResult {
  /** The firearm this result is for. */
  firearm: AnalysisFirearm;
  /** The load fired. Null when there is none. */
  ammunition: AnalysisAmmunition | null;
  /** The load's muzzle velocity from this firearm's barrel, in m/s. */
  muzzleVelocityMps: number | null;
  /** The sights the path is measured from. */
  sight: { heightMm: number; source: 'query' | 'category' };
  /** The maximum point-blank range, every distance to the metre. Null when it could not be computed; `error` says why. */
  pointBlank: {
    rangeM: number;
    nearZeroM: number;
    /** The zero that gives this range. */
    farZeroM: number;
    peakM: number;
    peakHeightMm: number;
    boreAngleMrad: number;
    timeOfFlightS: number;
    velocityMps: number;
  } | null;
  /** How far the bullet stays supersonic. `beyondProfile` means at least `rangeM`. */
  supersonic: { rangeM: number; timeOfFlightS: number; beyondProfile: boolean } | null;
  /** Against the option with the longest point-blank range. */
  delta: { rangeM: number; farZeroM: number } | null;
  /** What an answer needs qualifying with. */
  warnings: string[];
  /** Why this firearm could not be answered. Null when it was. */
  error: string | null;
}

/**
 * Maximum point-blank range and supersonic range for each firearm, on the
 * trajectory `/v1/firearms/{id}/load` flies.
 *
 * Returned by `GET /v1/firearms/point-blank`.
 */
export interface PointBlankComparison {
  /** The method behind every figure. */
  method: { id: string; name: string; equation: string; citations: AnalysisCitation[]; resolutionM: number; maxRangeM: number };
  /** The ICAO standard atmosphere at sea level, as the trajectory solver uses it. */
  atmosphere: { name: string; temperatureC: number; pressureKpa: number; airDensityKgM3: number; speedOfSoundMps: number };
  /** The target every firearm was answered for. */
  target: { diameterMm: number; radiusMm: number; defaulted: string[] };
  /** One result per firearm, in the order their ids were given. */
  results: PointBlankResult[];
}

/** A figure the cartridge-mass model estimates: its expected value and the range its error allows. */
export interface MassEstimate {
  expected: number;
  low: number;
  high: number;
}

/** One firearm's ammunition as a weight. */
export interface AmmoLoadResult {
  /** The firearm this result is for. */
  firearm: { id: string; name: string; magazineType: string | null; magazineCapacity: number | null };
  /** The cartridge the estimate is for. Null when the firearm records none. */
  cartridge: {
    caliberId: string;
    bulletG: number | null;
    bulletSource: 'ammunition' | 'caliber' | null;
    ammunitionId: string | null;
    envelopeCm3: number | null;
  } | null;
  /** A full magazine, derived as loaded weight less empty weight. Null without a detachable magazine, both weights and a capacity. */
  magazine: {
    loadedMagazineG: number;
    capacity: number;
    roundsPerKg: number;
    source: 'derived';
    /** The derived magazine held against the cartridge-mass model. */
    check: {
      verdict: 'plausible' | 'lighter-than-rounds' | 'below-band' | 'above-band';
      roundsG: MassEstimate;
      bandG: { low: number; high: number };
      source: 'estimated';
    } | null;
  } | null;
  /** What `budget_kg` of full magazines holds. */
  budget: { magazines: number; rounds: number; massG: number; leftoverG: number; source: 'derived' } | null;
  /** A basic load's mass by the cartridge-mass model, every figure estimated. */
  basicLoad: {
    rounds: number;
    roundG: MassEstimate;
    roundsG: MassEstimate;
    magazines: number;
    magazinesG: MassEstimate | null;
    source: 'estimated';
  } | null;
  /** Against the option that carries the most rounds per kilogram. */
  delta: { roundsPerKg: number; budgetRounds: number } | null;
  /** Why a figure is missing, or why a derived one is doubtful. */
  warnings: string[];
  /** Why nothing could be computed for this firearm. Null when anything was. */
  error: string | null;
}

/**
 * Rounds per kilogram, a weight budget and an estimated basic load for each
 * firearm. Derived figures and estimated ones are labelled and never mixed.
 *
 * Returned by `GET /v1/firearms/ammo-load`.
 */
export interface AmmoLoadComparison {
  /** The method behind every figure. */
  method: {
    id: string;
    name: string;
    equation: string;
    /** The model's largest error on its reference cartridges, in percent. */
    maxErrorPct: number;
    fittedEnvelopeCm3: number[];
    references: Array<{ name: string; load: string; roundG: number; source: string }>;
  };
  /** The load every firearm was answered for. */
  load: { budgetKg: number; magazines: number; rounds: number | null; ammoId: string | null; defaulted: string[] };
  /** One result per firearm, in the order their ids were given. */
  results: AmmoLoadResult[];
}

// ── Head-to-Head ───────────────────────────────────────────────────────────

/**
 * Head-to-head comparison of two firearms on numeric specs.
 *
 * Returned by `GET /v1/firearms/head-to-head`.
 */
export interface HeadToHead {
  /** Firearm A raw data (snake_case keys from D1). */
  a: Record<string, unknown>;
  /** Firearm B raw data (snake_case keys from D1). */
  b: Record<string, unknown>;
  /** Per-field verdicts indicating which firearm is superior. */
  verdicts: Record<string, {
    /** Which firearm wins for this field; `unknown` when only one of them states it. */
    winner: 'a' | 'b' | 'draw' | 'unknown';
    /** Value for firearm A. */
    a: number | null;
    /** Value for firearm B. */
    b: number | null;
    /** Human-readable description of why the winner is better. */
    better: string;
  }>;
}

// ── Family Tree ────────────────────────────────────────────────────────────

/**
 * Firearm family tree (ancestors + current + descendants).
 *
 * Returned by `GET /v1/firearms/:id/family`.
 */
export interface FamilyTree {
  /** Ancestor firearms (oldest first). */
  ancestors: Record<string, unknown>[];
  /** The requested firearm (full record). */
  current: Firearm;
  /** Descendant / variant firearms. */
  descendants: Record<string, unknown>[];
}

// ── Similar Firearms ───────────────────────────────────────────────────────

/**
 * A similar firearm with a computed similarity score.
 *
 * Returned by `GET /v1/firearms/:id/similar`.
 */
export interface SimilarFirearm {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Similarity score (higher is more similar). */
  score: number;
}

// ── Adoption Map ───────────────────────────────────────────────────────────

/**
 * Adoption map for a firearm, grouped by country.
 *
 * Returned by `GET /v1/firearms/:id/adoption`.
 */
export interface AdoptionMap {
  /** Firearm slug. */
  firearmId: string;
  /** Firearm name. */
  firearmName: string;
  /** Users grouped by country. */
  countries: Array<{
    /** ISO country code (may be `null` for unknown). */
    code: string | null;
    /** Institutional users in this country. */
    users: Array<{
      name: string;
      type: string | null;
      year: number | null;
      designation: string | null;
    }>;
  }>;
}

// ── Top Firearms ───────────────────────────────────────────────────────────

/**
 * A firearm in a "top N" ranking.
 *
 * Returned by `GET /v1/firearms/top`.
 */
export interface TopFirearmItem {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Manufacturer slug. */
  manufacturerId: string;
  /** Category slug. */
  categoryId: string;
  /** The stat value used for ranking. */
  value: number;
  /** Unit of the stat (e.g. `"g"`, `"m"`, `"rpm"`). */
  unit: string;
}

// ── Power Rating ───────────────────────────────────────────────────────────

/**
 * A firearm's computed power rating with breakdown.
 *
 * Returned by `GET /v1/firearms/power-rating`.
 */
export interface PowerRating {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Manufacturer slug. */
  manufacturerId: string;
  /** Category slug. */
  categoryId: string;
  /** Composite power rating (0-100 scale). */
  powerRating: number;
  /** Per-component breakdown of the power rating. */
  breakdown: {
    /** Energy component (max 30). */
    energy: number;
    /** Range component (max 25). */
    range: number;
    /** Fire rate component (max 20). */
    fireRate: number;
    /** Capacity component (max 15). */
    capacity: number;
    /** Mobility component (max 10). */
    mobility: number;
  };
}

// ── Timeline ───────────────────────────────────────────────────────────────

/**
 * A firearm in a chronological timeline listing.
 *
 * Returned by `GET /v1/firearms/timeline`.
 */
export interface TimelineItem {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Manufacturer slug. */
  manufacturerId: string;
  /** Category slug. */
  categoryId: string;
  /** Year introduced. */
  yearIntroduced: number | null;
  /** Year discontinued. */
  yearDiscontinued: number | null;
  /** Production status. */
  status: string | null;
  /** Country of origin ISO code. */
  countryOfOrigin: string | null;
}

// ── Dimensions ─────────────────────────────────────────────────────────────

/**
 * Firearm dimensions in both metric and imperial units.
 *
 * Returned by `GET /v1/firearms/:id/dimensions`.
 */
export interface Dimensions {
  /** Firearm slug. */
  id: string;
  /** Firearm name. */
  name: string;
  /** Metric measurements. */
  metric: {
    weightEmptyG: number | null;
    weightLoadedG: number | null;
    overallLengthMm: number | null;
    barrelLengthMm: number | null;
    heightMm: number | null;
    widthMm: number | null;
    foldedLengthMm: number | null;
  };
  /** Imperial measurements (converted from metric). */
  imperial: {
    weightEmptyLbs: number | null;
    weightLoadedLbs: number | null;
    overallLengthIn: number | null;
    barrelLengthIn: number | null;
    heightIn: number | null;
    widthIn: number | null;
    foldedLengthIn: number | null;
  };
}

// ── Filter Options ─────────────────────────────────────────────────────────

/**
 * Available filter dropdown options.
 *
 * Returned by `GET /v1/firearms/filters`.
 */
export interface FilterOptions {
  /** Available categories. */
  categories: Array<{ slug: string; name: string }>;
  /** Available manufacturers. */
  manufacturers: Array<{ id: string; name: string }>;
  /** Available calibers. */
  calibers: Array<{ id: string; name: string }>;
  /** Available action types. */
  actionTypes: Array<{ id: string; name: string }>;
}

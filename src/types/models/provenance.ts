// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Domain models: provenance
// ---------------------------------------------------------------------------

import type { SourceKind } from '../vocabulary';

export type { SourceKind };

/**
 * Where a record's figures came from and how far they have been checked.
 *
 * Carried as `provenance` on a firearm detail, a caliber and an attachment
 * detail. Check a specific figure against `sources` rather than against
 * `dataConfidence`; a null `verifiedAt` means the row is still seed model
 * knowledge that nobody has checked against the maker's page.
 */
export interface Provenance {
  /** The pages consulted when the record was compiled. */
  sources: string[];
  /**
   * Each cited page and what kind of source it is, in `sources` order, on the
   * hierarchy `SourceKind` defines (strongest first). A host the API has not
   * classed is `other`, never guessed.
   */
  sourceKinds: Array<{ url: string; kind: SourceKind }>;
  /**
   * The strongest kind among the citations, or null when nothing is cited.
   * `manufacturer` or `standards_body` means a figure can be checked against
   * an authority; `retailer` or `community` alone means the record rests on
   * copies. Weigh a figure by this, never by `sources.length`.
   */
  bestSourceKind: SourceKind | null;
  /** 0 to 1, set from what was actually sourced and never raised by hand. */
  dataConfidence: number | null;
  /** ISO-8601 timestamp of the last check against a source, or null. */
  verifiedAt: string | null;
  /** The fields the source stated, or null when nothing has been verified. */
  verifiedFields: string[] | null;
  /** Calibers only: the page the drawing dimensions were read from. */
  specSource?: string | null;
  /** When the served columns last changed. */
  updatedAt: string;
  /** Content hash; equal versions mean equal data, on every plan. */
  version: string | null;
}

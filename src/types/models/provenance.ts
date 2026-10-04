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
/** One cited page and how the source hierarchy stands on it. */
export interface ProvenanceSourceKind {
  /** Absolute, directly fetchable URL. */
  url: string;
  /** The kind of source the page is. */
  kind: SourceKind;
  /**
   * The original address when `url` is a Wayback Machine capture of it. A cited page that no longer
   * answers is replaced by its last capture that answered 200, so the citation still shows what its
   * author read; `kind` is the original page's.
   */
  archivedFrom: string | null;
  /** The kind's place in the source hierarchy: 0 is the maker, the strongest; higher is weaker. */
  rank: number;
  /**
   * Where the site stands in the source registry (`/v1/data/sources`): an authority (the maker, a
   * standards body, a government), a classified site, or one not yet classed.
   */
  tier: 'authority' | 'classified' | 'unclassified';
  /** What the class rests on: classed by a person, a catalogued maker's own site, a .gov or .mil domain, or nothing yet. */
  basis: 'declared' | 'maker' | 'rule' | 'unclassified';
  /** The words the site was classed on, where a person recorded them. */
  evidence: string | null;
}

/** One data-quality task on a record, as the record's provenance lists it. */
export interface ProvenanceCheck {
  /** The task's key. */
  task: string;
  /** Its public number, once assigned. */
  number: number | null;
  /** The check that raised it, when it came from one. */
  check: string | null;
  kind: string;
  /** The agent and instance that worked it. */
  agent: string | null;
  worker: string | null;
  status: string;
  decidedAt: string | null;
  /** What the agent proposed. */
  proposed: string | null;
  fields: string[];
  /** The pages it read. */
  sources: string[];
  /** A person's decision on the proposal, null until reviewed; the reviewer is never named. */
  review: { decision?: 'accepted' | 'rejected'; at?: string | null } | null;
  /** What the check found where a check raised the task: its own line for this record and the figures it measured. Null otherwise. */
  finding: { why: string | null; evidence: Record<string, unknown> | null } | null;
}

/** The task trail on a record: the latest twenty tasks, newest first, and the totals. */
export interface ProvenanceChecks {
  /** Every task ever raised on the record, answered or not. */
  raised: number;
  /** Tasks still waiting to be worked. */
  open: number;
  /** The latest twenty, newest first. */
  history: ProvenanceCheck[];
}

export interface Provenance {
  /** The pages consulted when the record was compiled. */
  sources: string[];
  /**
   * Each cited page and what kind of source it is, in `sources` order, on the
   * hierarchy `SourceKind` defines (strongest first). A host the API has not
   * classed is `other`, never guessed.
   */
  sourceKinds: ProvenanceSourceKind[];
  /**
   * The strongest kind among the citations, or null when nothing is cited.
   * `manufacturer` or `standards_body` means a figure can be checked against
   * an authority; `retailer` or `community` alone means the record rests on
   * copies. Weigh a figure by this, never by `sources.length`.
   */
  bestSourceKind: SourceKind | null;
  /**
   * The first cited page on the record's own manufacturer's website, or null when it cites none.
   * A page on another maker's site does not count. Cited from the maker is not the same as
   * checked against it: `verifiedFields` names the figures that were read against a source.
   */
  makerSource: string | null;
  /**
   * How far the figures have been checked, strongest first: `verified` (read against a source and
   * confirmed), `maker`, `authority`, `secondary`, or `none`.
   */
  evidence: 'verified' | 'maker' | 'authority' | 'secondary' | 'none';
  /** The record's data-quality task trail: how many findings were raised on it and what became of them. */
  checks?: ProvenanceChecks;
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

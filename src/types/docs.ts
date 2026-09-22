/**
 * The documentation as data (`GET /v1/docs/*`): what an operation takes and can
 * refuse, the samples the reference prints, and what each plan allows.
 */

/** A language a sample can be asked for: the reference's tabs, then the SDKs. */
export type DocsSampleLanguage =
  | 'curl'
  | 'javascript'
  | 'python'
  | 'unity'
  | 'unreal'
  | 'godot'
  | 'sdk-typescript'
  | 'sdk-python';

export type DocsHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Parameters for {@link DocsResource.getOperations}. */
export interface GetDocsOperationsParams {
  /** A documented template, a concrete path or a full URL. A path naming no operation is matched as a prefix. */
  path: string;
  /** Narrow to one method. */
  method?: DocsHttpMethod;
}

/** Parameters for {@link DocsResource.getSample}. */
export interface GetDocsSampleParams {
  /** A documented template, a concrete path or a full URL. */
  path: string;
  /** Needed only when the path answers more than one method. */
  method?: DocsHttpMethod;
  language: DocsSampleLanguage;
}

export interface DocsParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  type: string;
  required: boolean;
  description: string;
  /** The closed set accepted, or null where it is not one. */
  accepts: string[] | null;
  default: string | null;
  minimum: number | null;
  maximum: number | null;
}

export interface DocsError {
  status: number;
  message: string;
  code: string | null;
  /** The `error.reason` values this status can carry. Branch on these, never on `message`. */
  reasons: string[];
}

export interface DocsOperation {
  method: DocsHttpMethod;
  path: string;
  title: string;
  description: string;
  /** `public`, `account`, `explorer`, `builder`, `studio` or `enterprise`. */
  tier: string;
  auth: 'none' | 'optional' | 'required';
  /** Whether it answers `304 Not Modified` to `If-None-Match`. */
  cacheable: boolean;
  docsUrl: string;
  parameters: DocsParameter[];
  requestBody: { contentType: string; example: string } | null;
  success: { status: number; contentType: string };
  errors: DocsError[];
  notes: string[];
  sampleLanguages: DocsSampleLanguage[];
  sdk: Array<{ typescript: string; python: string | null }>;
}

export interface DocsOperations {
  /** `exact` when the path named an operation, `prefix` when these are the operations under it. */
  matched: 'exact' | 'prefix';
  specVersion: string;
  operations: DocsOperation[];
}

export interface DocsSample {
  /** The tab name, or the SDK call. */
  label: string;
  /** Exactly as the reference prints it. */
  code: string;
  /** The last run that checked it, or null when none has. */
  verification: { status: string; checkKind: 'executed' | 'static'; ranAt: string } | null;
  note: string | null;
}

export interface DocsSamples {
  method: DocsHttpMethod;
  path: string;
  tier: string;
  docsUrl: string;
  language: DocsSampleLanguage;
  /** How to fill in the key placeholder, or null for an operation that takes no key. */
  keyNote: string | null;
  samples: DocsSample[];
}

export interface DocsPlanLimits {
  tier: 'explorer' | 'builder' | 'studio' | 'enterprise';
  name: string;
  priceUsdCentsPerMonth: number;
  requestsPerMinute: number;
  requestsPerDay: number;
  requestsPerMonth: number;
  mcpCallsPerDay: number;
  /** The deepest page a list may be read to, or null for no limit. */
  maxPage: number | null;
  totalCountInLists: boolean;
}

export interface DocsLimits {
  plans: DocsPlanLimits[];
  withoutKey: { requestsPerDay: number; maxPage: number | null };
  paginationBurst: { pages: number; windowSeconds: number };
  retryAfterSeconds: { rateLimited: number; dailyCapReached: number };
  keyHeaders: string[];
  docsUrl: string;
}

/* ── The guides (`GET /v1/docs/guides`) ──
   The three above say what an operation declares. These say what the docs
   advise: how to page, when to retry, how long to keep a copy. Cut into the
   headings the pages are already divided into, because a whole guide is more
   than an answer needs and some run past sixty kilobytes. */

/** One heading on a guide. */
export interface DocsGuideHeading {
  /** The heading's anchor: `url#anchor` opens the page at it. */
  anchor: string;
  title: string;
  /** The heading with the ones above it, so a repeated heading says what it belongs to. */
  trail: string;
}

/** One heading on a guide, with its prose. */
export interface DocsGuideSection extends DocsGuideHeading {
  markdown: string;
}

/** A guide as the index lists it. */
export interface DocsGuideSummary {
  id: string;
  title: string;
  url: string;
  /** The opening prose: what the page is about. */
  summary: string;
  /** The whole page in Markdown, so a caller can tell what reading it costs. */
  sizeBytes: number;
  sections: DocsGuideHeading[];
}

export interface DocsGuides {
  total: number;
  guides: DocsGuideSummary[];
}

/** Parameters for {@link DocsResource.getGuide}. */
export interface GetDocsGuideParams {
  /** Return only the section this anchor names. Omitted, the whole page comes back. */
  anchor?: string;
}

/** A guide, whole or in one section. */
export interface DocsGuide {
  id: string;
  title: string;
  url: string;
  /** Sent with a whole page only. */
  summary?: string;
  /** The whole page. Sent when no anchor was given. */
  markdown?: string;
  /** The page's headings, or the named section's prose when an anchor was given. */
  sections: (DocsGuideHeading | DocsGuideSection)[];
}

/** Parameters for {@link DocsResource.searchGuides}. */
export interface SearchDocsGuidesParams {
  /** The question, in the words it would be asked in. */
  q: string;
  /** How many sections to return: 1 to 25, 8 by default. */
  limit?: number;
}

/** One section that answers a question. */
export interface DocsGuideSearchHit {
  guideId: string;
  guideTitle: string;
  anchor: string;
  title: string;
  trail: string;
  /** The page, opened at that heading. */
  url: string;
  /** The opening of the section, to judge it by without reading it. */
  snippet: string;
}

export interface DocsGuideSearch {
  query: string;
  /** How many sections matched, of which `results` carries the best. */
  total: number;
  results: DocsGuideSearchHit[];
}

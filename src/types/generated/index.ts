// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Generated OpenAPI types
// ---------------------------------------------------------------------------
// `openapi.d.ts` is written by `scripts/generate-openapi-types.mjs` from the
// API's `openapi.json`. The hand-written models in `../models`, `../compat`,
// `../seller` and `../media` are the public surface; these are the spec they
// are checked against. `components` is exported from the package for callers
// who want the raw schema shapes:
//
//   import type { components } from '@buun_group/gunspec-sdk'
//   type Firearm = components['schemas']['FirearmRecord']
//
// `paths` and `operations` stay internal (the mirror test reads them): they
// are most of the file and would triple the published declaration bundle.
// ---------------------------------------------------------------------------

export type { components, paths, operations } from './openapi';

/** A named schema from `#/components/schemas`, by its spec name. */
export type Schema<Name extends keyof import('./openapi').components['schemas']> =
  import('./openapi').components['schemas'][Name];

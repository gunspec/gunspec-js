/**
 * Current SDK version.
 *
 * Two writers, deliberately, because both paths must leave this equal to
 * `package.json`: `scripts/sync-version.mjs` runs as the `version` lifecycle
 * script (so a hand `npm version x.y.z` and the beta stamp in
 * `_publish-npm.yml` update both files), and release-please rewrites the
 * annotated line below when it prepares a release PR.
 */
export const VERSION = '0.13.0' // x-release-please-version

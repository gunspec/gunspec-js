#!/usr/bin/env node
/**
 * Keep `src/version.ts` equal to `package.json`'s version.
 *
 * Wired as the package's `version` lifecycle script, so `npm version x.y.z`
 * (which is what the release workflow runs to stamp a beta) updates both
 * files in one step and a hand bump cannot leave them disagreeing. Safe to
 * run on its own: `node scripts/sync-version.mjs`.
 *
 * It replaces the version literal in place rather than rewriting the file,
 * because release-please stamps the same line through its `x-release-please-version`
 * annotation. Rewriting would delete that marker, and release-please would then
 * silently stop updating this file - the two writers have to leave each other's
 * text alone. A file missing the literal is an error rather than a rewrite, so
 * the marker cannot be lost without the build saying so.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  process.stderr.write(`package.json version is not semver: ${JSON.stringify(version)}\n`)
  process.exit(1)
}

const file = resolve(root, 'src/version.ts')
const current = readFileSync(file, 'utf8')
const literal = /(export const VERSION = ')([^']*)(')/
const found = current.match(literal)
if (!found) {
  process.stderr.write("src/version.ts has no `export const VERSION = '...'` to update\n")
  process.exit(1)
}
if (found[2] !== version) {
  writeFileSync(file, current.replace(literal, `$1${version}$3`))
  process.stdout.write(`src/version.ts -> ${version}\n`)
}

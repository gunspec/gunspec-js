/**
 * WebCrypto lookup shared by webhook verification and the ETag cache.
 *
 * @module
 */

/**
 * WebCrypto, wherever this runs, or `undefined` when the runtime has none.
 * Browsers, Workers, Deno, Bun and Node 19+ expose it as `globalThis.crypto`;
 * Node 18 has the same implementation but only behind `node:crypto`. The
 * specifier is a variable so a browser bundler never tries to resolve the
 * Node module.
 */
export async function loadSubtle(): Promise<SubtleCrypto | undefined> {
  const global = (globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto;
  if (global?.subtle) return global.subtle;
  try {
    const specifier = 'node:crypto';
    const mod = (await import(/* @vite-ignore */ specifier)) as { webcrypto?: { subtle?: SubtleCrypto } };
    return mod.webcrypto?.subtle;
  } catch {
    return undefined;
  }
}

/**
 * The root of the SDK error hierarchy.
 *
 * @module
 */

/**
 * The key an error's class lineage is recorded under. `Symbol.for`, so every
 * copy of the SDK loaded in one process reads the same key.
 */
const LINEAGE = Symbol.for('@buun_group/gunspec-sdk/error-lineage');

/** The `brand` of every SDK error class from `ctor` up to `GunSpecError`, most specific first. */
function lineageOf(ctor: unknown): string[] {
  const brands: string[] = [];
  let current: unknown = ctor;
  while (typeof current === 'function' && Object.prototype.hasOwnProperty.call(current, 'brand')) {
    const brand: unknown = Reflect.get(current, 'brand');
    if (typeof brand === 'string') brands.push(brand);
    current = Object.getPrototypeOf(current);
  }
  return brands;
}

/**
 * Base error class for every error thrown by the GunSpec SDK.
 *
 * @remarks
 * Restores the prototype chain so `instanceof` checks work correctly even
 * when transpiled to ES5.
 *
 * **`instanceof` works across copies of the SDK.** The package ships two
 * entries (`@buun_group/gunspec-sdk` and `@buun_group/gunspec-sdk/tools`), and
 * a bundler or runtime can load each with its own copy of these classes. An
 * error thrown by one copy then failed `instanceof` against the other, so the
 * tool workflows' `instanceof APIError` never matched an error from the client
 * and a refused optional step failed the whole workflow. Each error now records
 * its class lineage under a global symbol, and `instanceof` checks that lineage
 * as well as the prototype chain. Every subclass declares its own `brand`.
 */
export class GunSpecError extends Error {
  /** The class's name in the lineage, stable across copies and minification. */
  static readonly brand: string = 'GunSpecError';

  override readonly name: string = 'GunSpecError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Object.defineProperty(this, LINEAGE, { value: lineageOf(new.target), enumerable: false });
  }

  /** `true` for an instance of this class from any copy of the SDK. */
  static [Symbol.hasInstance](value: unknown): boolean {
    if (Function.prototype[Symbol.hasInstance].call(this, value)) return true;
    if (typeof value !== 'object' || value === null) return false;
    const lineage: unknown = Reflect.get(value, LINEAGE);
    return Array.isArray(lineage) && lineage.includes(this.brand);
  }
}

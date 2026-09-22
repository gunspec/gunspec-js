/**
 * Path segment encoding for the resource classes.
 *
 * @module
 */

import { InvalidArgumentError } from './errors/index.js';

/**
 * Encode one caller-supplied value as a single URL path segment.
 *
 * `encodeURIComponent` alone is not enough: it leaves dots alone, and URL
 * parsing then treats a segment of `.` or `..` as a directory step, so
 * `/v1/me/webhooks/../test` reaches `/v1/me/test`. An empty value drops the
 * segment and reaches the collection instead of the record. None of the three
 * is ever a real id, so they are refused outright rather than escaped: a thrown
 * error names the mistake, where `%2E` would only move it to a 404.
 *
 * @throws {InvalidArgumentError} for `''`, `.` or `..`.
 */
export function pathSegment(value: string | number): string {
  const text = String(value);
  if (text === '' || text === '.' || text === '..') {
    throw new InvalidArgumentError(
      `${JSON.stringify(text)} is not a valid id: it would change which endpoint the request reaches`,
    );
  }
  return encodeURIComponent(text);
}

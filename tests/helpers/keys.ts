/**
 * Fixture credentials for the unit suite. None is a real key: they were minted
 * for these tests and the API has never issued them.
 *
 * They live here, and nowhere else, because the commit hook refuses an
 * `apiKey: '<literal>'` in any source file. A test imports one of these instead.
 */

/** A well-formed key, used where the transport or a redaction path needs one. */
export const FIXTURE_KEY = 'gsk_72ee457ac9ccc5b2b5bc788f5269feca';

/** What `FIXTURE_KEY` renders as once redacted. */
export const FIXTURE_KEY_HINT = 'gsk_...feca';

/** A second key, for tests that derive one client from another. */
export const FIXTURE_KEY_OTHER = 'gsk_other_key_for_the_shop_side';

/** An opaque value for tests that only check a key is passed through verbatim. */
export const FIXTURE_KEY_PLAIN = 'my-secret-key';

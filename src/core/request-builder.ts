/**
 * Request construction helpers for the GunSpec HTTP client.
 *
 * Handles query string serialisation and full URL assembly. Extracted from
 * the {@link HttpClient} so the transport class can focus on orchestration.
 *
 * @module
 */

/**
 * Serialise a query parameter map into a URL search string.
 *
 * - `undefined` and `null` values are skipped.
 * - Arrays produce repeated keys (`a=1&a=2`).
 * - Booleans are converted to `"true"` / `"false"`.
 */
export function serialiseQuery(
  params: Record<string, string | number | boolean | readonly string[] | null | undefined>,
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/**
 * Build the full URL from base URL, path, and query parameters.
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | readonly string[] | null | undefined>,
): string {
  const qs = query ? serialiseQuery(query) : '';
  return `${baseUrl}${path}${qs}`;
}

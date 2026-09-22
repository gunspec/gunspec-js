/**
 * Pagination utilities for the GunSpec SDK.
 *
 * Provides a {@link Page} wrapper around paginated API responses with
 * convenience methods for navigating between pages and an async iterator
 * for automatic consumption of all pages.
 *
 * @module
 */

import type { PaginatedResponse, PaginationMeta } from './http-client.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A function that fetches a specific page of results.
 *
 * Used internally by {@link Page} to implement {@link Page.getNextPage} and
 * the async iterator without exposing the full `HttpClient` to consumers.
 *
 * @typeParam T - The element type of the paginated list.
 */
export type PageFetcher<T> = (query: Record<string, string | number | boolean | string[] | undefined>) => Promise<PaginatedResponse<T>>;

// ---------------------------------------------------------------------------
// Page class
// ---------------------------------------------------------------------------

/**
 * A single page of results from a paginated API endpoint.
 *
 * Wraps the raw {@link PaginatedResponse} and adds navigation helpers:
 *
 * - {@link hasNextPage} - check if more pages are available.
 * - {@link getNextPage} - fetch the next page.
 * - `Symbol.asyncIterator` - iterate over **all** items across all pages.
 *
 * @typeParam T - The type of each item in the page.
 *
 * @example
 * ```ts
 * const page = await client.firearms.list({ page: 1, limit: 25 });
 *
 * // Manual navigation
 * console.log(page.data);          // Firearm[]
 * console.log(page.pagination);    // { page: 1, limit: 25, total: 400, totalPages: 16 }
 *
 * if (page.hasNextPage()) {
 *   const next = await page.getNextPage();
 * }
 *
 * // Automatic iteration over all items
 * for await (const firearm of page) {
 *   console.log(firearm.name);
 * }
 * ```
 */
export class Page<T> {
  /** The items on this page. */
  readonly data: T[];

  /** Pagination metadata returned by the server. */
  readonly pagination: PaginationMeta;

  /** The request ID for this page's HTTP response. */
  readonly requestId: string;

  /** The base query parameters used to fetch this page (without `page`). */
  private readonly baseQuery: Record<string, string | number | boolean | string[] | undefined>;

  /** The fetcher function used to retrieve subsequent pages. */
  private readonly fetcher: PageFetcher<T>;

  /**
   * @internal
   * Consumers should not construct `Page` instances directly.  Use the
   * resource methods on the high-level client instead.
   */
  constructor(
    response: PaginatedResponse<T>,
    baseQuery: Record<string, string | number | boolean | string[] | undefined>,
    fetcher: PageFetcher<T>,
  ) {
    this.data = response.data;
    this.pagination = response.pagination;
    this.requestId = response.requestId;
    this.baseQuery = baseQuery;
    this.fetcher = fetcher;
  }

  /**
   * Whether there is a next page of results.
   *
   * When `totalPages` is available (pro/enterprise tiers) the check is exact.
   * Otherwise the heuristic is: if the current page returned a full page of
   * results (i.e. `data.length === limit`), there is likely another page.
   */
  hasNextPage(): boolean {
    if (this.pagination.totalPages !== undefined) {
      return this.pagination.page < this.pagination.totalPages;
    }
    // Heuristic: if we received a full page, assume there are more.
    return this.data.length >= this.pagination.limit;
  }

  /**
   * Fetch the next page of results.
   *
   * @returns A new {@link Page} instance for the next page.
   * @throws {Error} If there is no next page.  Always check
   *         {@link hasNextPage} first.
   */
  async getNextPage(): Promise<Page<T>> {
    if (!this.hasNextPage()) {
      throw new Error('No more pages available. Check hasNextPage() before calling getNextPage().');
    }

    const nextQuery = {
      ...this.baseQuery,
      page: this.pagination.page + 1,
    };

    const response = await this.fetcher(nextQuery);
    return new Page<T>(response, this.baseQuery, this.fetcher);
  }

  /**
   * Fetch the previous page of results.
   *
   * @returns A new {@link Page} instance for the previous page.
   * @throws {Error} If this is already the first page.
   */
  async getPreviousPage(): Promise<Page<T>> {
    if (this.pagination.page <= 1) {
      throw new Error('Already on the first page. Cannot navigate to a previous page.');
    }

    const prevQuery = {
      ...this.baseQuery,
      page: this.pagination.page - 1,
    };

    const response = await this.fetcher(prevQuery);
    return new Page<T>(response, this.baseQuery, this.fetcher);
  }

  /**
   * Async iterator that yields every item across **all** pages, starting
   * from the current page.
   *
   * Fetches subsequent pages on demand (lazily) so memory usage stays
   * constant regardless of the total result set size.
   *
   * @example
   * ```ts
   * const firstPage = await client.firearms.list({ limit: 50 });
   * for await (const firearm of firstPage) {
   *   // Iterates page 1, then auto-fetches page 2, 3, ... until exhausted.
   *   console.log(firearm.name);
   * }
   * ```
   */
  async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: Page<T> = this;

    while (true) {
      for (const item of current.data) {
        yield item;
      }

      if (!current.hasNextPage()) {
        break;
      }

      current = await current.getNextPage();
    }
  }
}

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

/**
 * Create a {@link Page} from a raw paginated HTTP response.
 *
 * This is the primary factory used by resource classes to wrap their list
 * endpoints.
 *
 * @typeParam T - The element type.
 * @param response  - The raw paginated response from {@link HttpClient.requestPaginated}.
 * @param baseQuery - The query parameters used for the request (the `page`
 *                    key is managed automatically).
 * @param fetcher   - A function that fetches a specific page given query
 *                    parameters.
 * @returns A new {@link Page} instance.
 */
export function createPage<T>(
  response: PaginatedResponse<T>,
  baseQuery: Record<string, string | number | boolean | string[] | undefined>,
  fetcher: PageFetcher<T>,
): Page<T> {
  return new Page(response, baseQuery, fetcher);
}

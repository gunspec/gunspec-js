import type { HttpClient, APIResponse } from '../core';
import type {
  UsageStats,
  UsageParams,
} from '../types';

/**
 * What this key has spent against its plan.
 *
 * The same counters the rate limiter and the daily cap read, so a client can
 * slow itself down before a 429 rather than after one. A 304 costs a
 * rate-limit slot but no daily quota, which is why a caching client sees this
 * number rise more slowly than its request count.
 *
 * @example
 * ```typescript
 * const { data } = await client.usage.get();
 * console.log(`${data.requests_today} of ${data.daily_limit} today`);
 * ```
 */
export class UsageResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Current usage for the calling key.
   *
   * @param params - Optional window.
   * @returns Requests today and this month against the plan's ceilings.
   */
  async get(params?: UsageParams): Promise<APIResponse<UsageStats>> {
    return this.client.get<UsageStats>('/v1/me/usage', params);
  }
}

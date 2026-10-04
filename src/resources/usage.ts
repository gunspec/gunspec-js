import type { HttpClient, APIResponse } from '../core';
import type {
  UsageStats,
  UsageParams,
} from '../types';

/**
 * What this key has spent against its plan.
 *
 * The same counters the rate limiter and the caps read. `daily` is the limit
 * that is enforced per key, held against each key on its own: `limitPerKey`,
 * what the busiest key has left, and `resetsAt`, the next midnight UTC.
 * `currentMonth` is the plan's allowance, enforced for the whole account: calls
 * served this month (`used`), `limit`, `remaining` and `resetsAt`, midnight UTC
 * on the 1st.
 *
 * To slow down before a 429 you do not need to call this: every response
 * already carries what is left of the day and the month as
 * `response.rateLimit` (`dailyRemaining`, `dailyReset`, `monthlyRemaining`,
 * `monthlyReset`). Use this to reconcile and to see every key at once, and
 * remember it is itself a request. A 304 costs a rate-limit slot but spends
 * neither the day nor the month, which is why a caching client sees these
 * numbers rise more slowly than its request count.
 *
 * @example
 * ```typescript
 * const { data } = await client.usage.get();
 * const busiest = data.daily?.busiestKeyToday;
 * if (busiest) {
 *   console.log(`${busiest.used} of ${data.daily?.limitPerKey} today, resets ${data.daily?.resetsAt}`);
 * }
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

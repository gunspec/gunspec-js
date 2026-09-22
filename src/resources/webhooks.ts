import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  WebhookEndpoint,
  WebhookEndpointCreated,
  WebhookTestResult,
  CreateWebhookEndpointParams,
  UpdateWebhookEndpointParams,
  ListWebhookEndpointsParams,
} from '../types';

/**
 * Signed delivery of catalog changes to your own endpoint.
 *
 * An endpoint subscribes to events (`firearm.updated`, `catalog.resynced` and
 * the rest) and receives the same payload `GET /v1/firearms/{id}` returns, so
 * a mirror can apply a delivery without re-fetching. Every request carries a
 * signature made with the secret `create()` returns once. Failed deliveries
 * are retried on a schedule, so a brief outage at your end costs nothing.
 *
 * @example
 * ```typescript
 * const { data } = await client.webhooks.create({
 *   url: 'https://example.com/hooks/gunspec',
 *   events: ['firearm.updated', 'firearm.deleted'],
 * });
 * console.log(data.secret); // shown once, so store it; it signs every delivery
 * ```
 */
export class WebhooksResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * The account's endpoints with their subscribed events and delivery health.
   *
   * @param params - Pagination.
   * @returns One page of endpoints. Secrets are never returned again.
   */
  async list(params?: ListWebhookEndpointsParams): Promise<PaginatedResponse<WebhookEndpoint>> {
    return this.client.getPaginated<WebhookEndpoint>('/v1/me/webhooks', params);
  }

  /** The response is the only one that carries the signing `secret`; store it. */
  async create(params: CreateWebhookEndpointParams): Promise<APIResponse<WebhookEndpointCreated>> {
    return this.client.post<WebhookEndpointCreated>('/v1/me/webhooks', params);
  }

  /**
   * One endpoint, with its recent delivery state.
   *
   * @param id - The endpoint id.
   * @returns The endpoint. The signing secret is not included.
   */
  async get(id: string): Promise<APIResponse<WebhookEndpoint>> {
    return this.client.get<WebhookEndpoint>(`/v1/me/webhooks/${encodeURIComponent(id)}`);
  }

  /**
   * Change an endpoint's URL, event list or enabled flag.
   *
   * @param id - The endpoint id.
   * @param params - The fields to change.
   * @returns The updated endpoint.
   */
  async update(id: string, params: UpdateWebhookEndpointParams): Promise<APIResponse<WebhookEndpoint>> {
    return this.client.put<WebhookEndpoint>(`/v1/me/webhooks/${encodeURIComponent(id)}`, params);
  }

  /**
   * Delete an endpoint. Undelivered retries for it are dropped with it.
   *
   * @param id - The endpoint id.
   * @returns Confirmation of the delete.
   */
  async delete(id: string): Promise<APIResponse<{ deleted: boolean }>> {
    return this.client.delete<{ deleted: boolean }>(`/v1/me/webhooks/${encodeURIComponent(id)}`);
  }

  /**
   * Send a signed test delivery, so a new endpoint can be verified before an
   * event depends on it.
   *
   * @param id - The endpoint id.
   * @returns What your endpoint answered: status, latency and any error.
   */
  async test(id: string): Promise<APIResponse<WebhookTestResult>> {
    return this.client.post<WebhookTestResult>(`/v1/me/webhooks/${encodeURIComponent(id)}/test`);
  }
}

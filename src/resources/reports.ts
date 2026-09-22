import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  DataReport,
  CreateReportParams,
  ListReportsParams,
} from '../types';

/**
 * Data corrections the account has reported.
 *
 * A report is how a consumer tells us a specification is wrong. It is reviewed
 * by a person and never applied automatically; nothing here writes to the
 * catalog. Session-scoped (`/v1/me/*`).
 *
 * @example
 * ```typescript
 * await client.reports.create({
 *   firearm_id: 'glock-17-gen5',
 *   field: 'weight_g',
 *   description: 'Maker lists 625 g unloaded, we have 710 g.',
 * });
 * ```
 */
export class ReportsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Report an incorrect or missing value.
   *
   * @param params - What is wrong, on which record, and the source if you have one.
   * @returns The stored report, with the id to quote in support.
   */
  async create(params: CreateReportParams): Promise<APIResponse<DataReport>> {
    return this.client.post<DataReport>('/v1/me/reports', params);
  }

  /**
   * The reports this account has filed, newest first, with their review state.
   *
   * @param params - Pagination and filters.
   * @returns One page of reports.
   */
  async list(params?: ListReportsParams): Promise<PaginatedResponse<DataReport>> {
    return this.client.getPaginated<DataReport>('/v1/me/reports', params);
  }
}

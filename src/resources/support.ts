import { pathSegment } from '../core/path';
import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type {
  SupportTicket,
  SupportTicketDetail,
  SupportTicketReply,
  CreateTicketParams,
  ListTicketsParams,
  CreateReplyParams,
} from '../types';

/**
 * Support tickets for the signed-in account.
 *
 * The same thread staff sees in the console, so a reply posted here reaches a
 * person and their answer comes back on the ticket. Session-scoped
 * (`/v1/me/*`).
 *
 * @example
 * ```typescript
 * const { data: ticket } = await client.support.create({
 *   subject: 'Rate limit on the Studio plan',
 *   message: 'We are seeing 429s well under the documented ceiling.',
 * });
 * await client.support.reply(ticket.id, { message: 'Adding a request id: req_123.' });
 * ```
 */
export class SupportResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Open a ticket.
   *
   * @param params - Subject and first message.
   * @returns The created ticket, including the id the replies hang off.
   */
  async create(params: CreateTicketParams): Promise<APIResponse<SupportTicket>> {
    return this.client.post<SupportTicket>('/v1/me/support', params);
  }

  /**
   * The account's tickets, newest first.
   *
   * @param params - Pagination and status filter.
   * @returns One page of tickets without their replies.
   */
  async list(params?: ListTicketsParams): Promise<PaginatedResponse<SupportTicket>> {
    return this.client.getPaginated<SupportTicket>('/v1/me/support', params);
  }

  /**
   * One ticket with its whole conversation.
   *
   * @param ticketId - The ticket id.
   * @returns The ticket and every reply on it, oldest first.
   */
  async get(ticketId: string): Promise<APIResponse<SupportTicketDetail>> {
    return this.client.get<SupportTicketDetail>(`/v1/me/support/${pathSegment(ticketId)}`);
  }

  /**
   * Add a message to an open ticket.
   *
   * @param ticketId - The ticket id.
   * @param params - The message body.
   * @returns The stored reply.
   */
  async reply(ticketId: string, params: CreateReplyParams): Promise<APIResponse<SupportTicketReply>> {
    return this.client.post<SupportTicketReply>(`/v1/me/support/${pathSegment(ticketId)}/replies`, params);
  }
}

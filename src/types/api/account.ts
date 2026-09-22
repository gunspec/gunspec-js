// ---------------------------------------------------------------------------
// @buun_group/gunspec-sdk - Request parameters: account
// ---------------------------------------------------------------------------

// ── User-Scoped (via /v1/me) ─────────────────────────────────────────────

/**
 * Parameters for `GET /v1/me/favorites`.
 */
export interface ListFavoritesParams {
  /** Page number (1-based). */
  page?: number;
  /** Items per page (1-100). */
  limit?: number;
}

/**
 * Body for `POST /v1/me/reports`.
 */
export interface CreateReportParams {
  /** Firearm slug to report on. */
  firearmId: string;
  /** Section of the firearm data. */
  section: 'game-stats' | 'specs' | 'ballistics' | 'barrel' | 'materials' | 'operating' | 'calibers' | 'users' | 'description';
  /** Type of data issue. */
  issueType: 'incorrect' | 'missing' | 'outdated';
  /** Description of the issue (10-2000 chars). */
  description: string;
  /** Optional reference URLs (max 5). */
  references?: string[];
  /** Optional suggested correction (max 1000 chars). */
  suggestedValue?: string;
}

/**
 * Parameters for `GET /v1/me/reports`.
 */
export interface ListReportsParams {
  /** Page number (1-based). */
  page?: number;
  /** Items per page (1-100). */
  per_page?: number;
}

/**
 * Body for `POST /v1/me/support`.
 */
export interface CreateTicketParams {
  /** Ticket subject (1-200 chars). */
  subject: string;
  /** Ticket description (1-5000 chars). */
  description: string;
  /** Ticket category. */
  category?: 'billing' | 'technical' | 'data_quality' | 'feature_request' | 'other';
  /** Priority level. */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

/**
 * Parameters for `GET /v1/me/support`.
 */
export interface ListTicketsParams {
  /** Page number (1-based). */
  page?: number;
  /** Items per page (1-100). */
  per_page?: number;
  /** Filter by status. */
  status?: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  /** Sort column. */
  sort?: 'created_at' | 'updated_at' | 'status' | 'priority';
  /** Sort direction. */
  order?: 'asc' | 'desc';
}

/**
 * Body for `POST /v1/me/support/:ticketId/replies`.
 */
export interface CreateReplyParams {
  /** Reply message (1-5000 chars). */
  message: string;
}

/**
 * Body for `POST /v1/me/webhooks`.
 */
export interface CreateWebhookEndpointParams {
  /** Delivery URL. */
  url: string;
  /** Optional description. */
  description?: string;
  /** Event types to subscribe to (at least one). */
  events: string[];
}

/**
 * Body for `PUT /v1/me/webhooks/:id`.
 */
export interface UpdateWebhookEndpointParams {
  /** New delivery URL. */
  url?: string;
  /** Updated description. */
  description?: string | null;
  /** Updated event subscriptions. */
  events?: string[];
  /** Whether the endpoint is active. */
  active?: boolean;
}

/**
 * Parameters for `GET /v1/me/webhooks`.
 */
export interface ListWebhookEndpointsParams {
  /** Page number (1-based). */
  page?: number;
  /** Items per page (1-100). */
  per_page?: number;
}

/**
 * Parameters for `GET /v1/me/usage`.
 */
export interface UsageParams {
  /** Month in YYYY-MM format. */
  month?: string;
  /** Number of days for daily breakdown (1-90). */
  days?: number;
}

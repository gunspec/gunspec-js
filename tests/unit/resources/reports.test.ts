import { describe, it, expect, beforeEach } from 'vitest';
import { ReportsResource } from '../../../src/resources/reports';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('ReportsResource', () => {
  let client: MockClient;
  let reports: ReportsResource;

  beforeEach(() => {
    client = createMockClient();
    reports = new ReportsResource(client);
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('calls post with /v1/me/reports and params body', async () => {
      const params = { firearm_id: 'glock-g17', type: 'incorrect_data', description: 'Wrong weight' };
      client.post.mockResolvedValue(mockApiResponse({ id: 'rpt-1' }));
      await reports.create(params);
      expect(client.post).toHaveBeenCalledWith('/v1/me/reports', params);
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ id: 'rpt-1', status: 'pending' });
      client.post.mockResolvedValue(expected);
      const result = await reports.create({ firearm_id: 'x', type: 'bug', description: 'test' });
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls getPaginated with /v1/me/reports and no params', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await reports.list();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/me/reports', undefined);
    });

    it('forwards query params', async () => {
      const params = { page: 2, per_page: 5 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await reports.list(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/me/reports', params);
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ id: 'rpt-1' }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await reports.list();
      expect(result).toBe(expected);
    });
  });
});

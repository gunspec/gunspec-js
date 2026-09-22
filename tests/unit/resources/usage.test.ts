import { describe, it, expect, beforeEach } from 'vitest';
import { UsageResource } from '../../../src/resources/usage';
import {
  createMockClient,
  mockApiResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('UsageResource', () => {
  let client: MockClient;
  let usage: UsageResource;

  beforeEach(() => {
    client = createMockClient();
    usage = new UsageResource(client);
  });

  // ---------------------------------------------------------------------------
  // get
  // ---------------------------------------------------------------------------
  describe('get', () => {
    it('calls get with /v1/me/usage and no params', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await usage.get();
      expect(client.get).toHaveBeenCalledWith('/v1/me/usage', undefined);
    });

    it('forwards params', async () => {
      const params = { from: '2025-01-01', to: '2025-01-31' };
      client.get.mockResolvedValue(mockApiResponse({}));
      await usage.get(params);
      expect(client.get).toHaveBeenCalledWith('/v1/me/usage', params);
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ requestCount: 1000, limit: 25000 });
      client.get.mockResolvedValue(expected);
      const result = await usage.get();
      expect(result).toBe(expected);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { DataQualityResource } from '../../../src/resources/data-quality';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('DataQualityResource', () => {
  let client: MockClient;
  let dataQuality: DataQualityResource;

  beforeEach(() => {
    client = createMockClient();
    dataQuality = new DataQualityResource(client);
  });

  // ---------------------------------------------------------------------------
  // coverage
  // ---------------------------------------------------------------------------
  describe('coverage', () => {
    it('calls get with /v1/data/coverage', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await dataQuality.coverage();
      expect(client.get).toHaveBeenCalledWith('/v1/data/coverage');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ overallCoverage: 85 });
      client.get.mockResolvedValue(expected);
      const result = await dataQuality.coverage();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // confidence
  // ---------------------------------------------------------------------------
  describe('confidence', () => {
    it('calls getPaginated with /v1/data/confidence and no params', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await dataQuality.confidence();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/data/confidence', undefined);
    });

    it('forwards params', async () => {
      const params = { below: 0.5, per_page: 25 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await dataQuality.confidence(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/data/confidence', params);
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ name: 'low-conf', confidenceScore: 0.2 }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await dataQuality.confidence();
      expect(result).toBe(expected);
    });
  });
});

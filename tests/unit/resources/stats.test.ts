import { describe, it, expect, beforeEach } from 'vitest';
import { StatsResource } from '../../../src/resources/stats';
import {
  createMockClient,
  mockApiResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('StatsResource', () => {
  let client: MockClient;
  let stats: StatsResource;

  beforeEach(() => {
    client = createMockClient();
    stats = new StatsResource(client);
  });

  // ---------------------------------------------------------------------------
  // summary
  // ---------------------------------------------------------------------------
  describe('summary', () => {
    it('calls get with /v1/stats/summary', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await stats.summary();
      expect(client.get).toHaveBeenCalledWith('/v1/stats/summary');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ totalFirearms: 500 });
      client.get.mockResolvedValue(expected);
      const result = await stats.summary();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // productionStatus
  // ---------------------------------------------------------------------------
  describe('productionStatus', () => {
    it('calls get with /v1/stats/production-status', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.productionStatus();
      expect(client.get).toHaveBeenCalledWith('/v1/stats/production-status');
    });
  });

  // ---------------------------------------------------------------------------
  // fieldCoverage
  // ---------------------------------------------------------------------------
  describe('fieldCoverage', () => {
    it('calls get with /v1/stats/field-coverage', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await stats.fieldCoverage();
      expect(client.get).toHaveBeenCalledWith('/v1/stats/field-coverage');
    });
  });

  // ---------------------------------------------------------------------------
  // popularCalibers
  // ---------------------------------------------------------------------------
  describe('popularCalibers', () => {
    it('calls get with /v1/stats/calibers/popular and no params', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.popularCalibers();
      expect(client.get).toHaveBeenCalledWith('/v1/stats/calibers/popular', undefined);
    });

    it('forwards params', async () => {
      const params = { limit: 10 };
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.popularCalibers(params);
      expect(client.get).toHaveBeenCalledWith('/v1/stats/calibers/popular', params);
    });
  });

  // ---------------------------------------------------------------------------
  // prolificManufacturers
  // ---------------------------------------------------------------------------
  describe('prolificManufacturers', () => {
    it('calls get with /v1/stats/manufacturers/prolific and no params', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.prolificManufacturers();
      expect(client.get).toHaveBeenCalledWith('/v1/stats/manufacturers/prolific', undefined);
    });

    it('forwards params', async () => {
      const params = { limit: 10, category: 'pistol' };
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.prolificManufacturers(params);
      expect(client.get).toHaveBeenCalledWith('/v1/stats/manufacturers/prolific', params);
    });
  });

  // ---------------------------------------------------------------------------
  // byCategory
  // ---------------------------------------------------------------------------
  describe('byCategory', () => {
    it('calls get with /v1/stats/by-category', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.byCategory();
      expect(client.get).toHaveBeenCalledWith('/v1/stats/by-category');
    });
  });

  // ---------------------------------------------------------------------------
  // byEra
  // ---------------------------------------------------------------------------
  describe('byEra', () => {
    it('calls get with /v1/stats/by-era and params', async () => {
      const params = { decade: '1940s' };
      client.get.mockResolvedValue(mockApiResponse({}));
      await stats.byEra(params);
      expect(client.get).toHaveBeenCalledWith('/v1/stats/by-era', params);
    });
  });

  // ---------------------------------------------------------------------------
  // materials
  // ---------------------------------------------------------------------------
  describe('materials', () => {
    it('calls get with /v1/stats/materials', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await stats.materials();
      expect(client.get).toHaveBeenCalledWith('/v1/stats/materials');
    });
  });

  // ---------------------------------------------------------------------------
  // adoptionByCountry
  // ---------------------------------------------------------------------------
  describe('adoptionByCountry', () => {
    it('calls get with /v1/stats/adoption/by-country and params', async () => {
      const params = { code: 'US' };
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.adoptionByCountry(params);
      expect(client.get).toHaveBeenCalledWith('/v1/stats/adoption/by-country', params);
    });
  });

  // ---------------------------------------------------------------------------
  // adoptionByType
  // ---------------------------------------------------------------------------
  describe('adoptionByType', () => {
    it('calls get with /v1/stats/adoption/by-type and params', async () => {
      const params = { type: 'military' };
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.adoptionByType(params);
      expect(client.get).toHaveBeenCalledWith('/v1/stats/adoption/by-type', params);
    });
  });

  // ---------------------------------------------------------------------------
  // actionTypes
  // ---------------------------------------------------------------------------
  describe('actionTypes', () => {
    it('calls get with /v1/stats/action-types and no params', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.actionTypes();
      expect(client.get).toHaveBeenCalledWith('/v1/stats/action-types', undefined);
    });

    it('forwards params', async () => {
      const params = { category: 'rifle' };
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.actionTypes(params);
      expect(client.get).toHaveBeenCalledWith('/v1/stats/action-types', params);
    });
  });

  // ---------------------------------------------------------------------------
  // featureFrequency
  // ---------------------------------------------------------------------------
  describe('featureFrequency', () => {
    it('calls get with /v1/stats/feature-frequency and no params', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.featureFrequency();
      expect(client.get).toHaveBeenCalledWith('/v1/stats/feature-frequency', undefined);
    });

    it('forwards params', async () => {
      const params = { category: 'pistol', limit: 20 };
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.featureFrequency(params);
      expect(client.get).toHaveBeenCalledWith('/v1/stats/feature-frequency', params);
    });
  });

  // ---------------------------------------------------------------------------
  // caliberPopularityByEra
  // ---------------------------------------------------------------------------
  describe('caliberPopularityByEra', () => {
    it('calls get with /v1/stats/caliber-popularity-by-era and no params', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.caliberPopularityByEra();
      expect(client.get).toHaveBeenCalledWith('/v1/stats/caliber-popularity-by-era', undefined);
    });

    it('forwards params', async () => {
      const params = { from_decade: '1940s', to_decade: '2020s' };
      client.get.mockResolvedValue(mockApiResponse([]));
      await stats.caliberPopularityByEra(params);
      expect(client.get).toHaveBeenCalledWith('/v1/stats/caliber-popularity-by-era', params);
    });
  });
});

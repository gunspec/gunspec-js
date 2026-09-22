import { describe, it, expect, beforeEach } from 'vitest';
import { CategoriesResource } from '../../../src/resources/categories';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('CategoriesResource', () => {
  let client: MockClient;
  let categories: CategoriesResource;

  beforeEach(() => {
    client = createMockClient();
    categories = new CategoriesResource(client);
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls get with /v1/categories', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await categories.list();
      expect(client.get).toHaveBeenCalledWith('/v1/categories');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse([{ slug: 'pistol', name: 'Pistol' }]);
      client.get.mockResolvedValue(expected);
      const result = await categories.list();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // getFirearms
  // ---------------------------------------------------------------------------
  describe('getFirearms', () => {
    it('calls getPaginated with /v1/categories/:slug/firearms', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await categories.getFirearms('pistol');
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/categories/pistol/firearms',
        undefined,
      );
    });

    it('forwards pagination params', async () => {
      const params = { per_page: 25, sort: 'name', order: 'asc' };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await categories.getFirearms('shotgun', params);
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/categories/shotgun/firearms',
        params,
      );
    });

    it('URL-encodes the category slug', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await categories.getFirearms('sub machine gun');
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/categories/sub%20machine%20gun/firearms',
        undefined,
      );
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ slug: 'glock-g17' }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await categories.getFirearms('pistol');
      expect(result).toBe(expected);
    });
  });
});

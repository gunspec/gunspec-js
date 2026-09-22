import { describe, it, expect, beforeEach } from 'vitest';
import { FavoritesResource } from '../../../src/resources/favorites';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('FavoritesResource', () => {
  let client: MockClient;
  let favorites: FavoritesResource;

  beforeEach(() => {
    client = createMockClient();
    favorites = new FavoritesResource(client);
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls getPaginated with /v1/me/favorites and no params', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await favorites.list();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/me/favorites', undefined);
    });

    it('forwards query params', async () => {
      const params = { page: 2, per_page: 10 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await favorites.list(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/me/favorites', params);
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ firearmId: 'glock-g17' }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await favorites.list();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // add
  // ---------------------------------------------------------------------------
  describe('add', () => {
    it('calls post with /v1/me/favorites/:firearmId', async () => {
      client.post.mockResolvedValue(mockApiResponse({ added: true }));
      await favorites.add('glock-g17');
      expect(client.post).toHaveBeenCalledWith('/v1/me/favorites/glock-g17');
    });

    it('URL-encodes the firearm id', async () => {
      client.post.mockResolvedValue(mockApiResponse({}));
      await favorites.add('a/b');
      expect(client.post).toHaveBeenCalledWith('/v1/me/favorites/a%2Fb');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ added: true });
      client.post.mockResolvedValue(expected);
      const result = await favorites.add('glock-g17');
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('calls delete with /v1/me/favorites/:firearmId', async () => {
      client.delete.mockResolvedValue(mockApiResponse({ removed: true }));
      await favorites.remove('glock-g17');
      expect(client.delete).toHaveBeenCalledWith('/v1/me/favorites/glock-g17');
    });

    it('URL-encodes the firearm id', async () => {
      client.delete.mockResolvedValue(mockApiResponse({}));
      await favorites.remove('a/b');
      expect(client.delete).toHaveBeenCalledWith('/v1/me/favorites/a%2Fb');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ removed: true });
      client.delete.mockResolvedValue(expected);
      const result = await favorites.remove('glock-g17');
      expect(result).toBe(expected);
    });
  });
});

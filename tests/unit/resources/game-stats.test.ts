import { describe, it, expect, beforeEach } from 'vitest';
import { GameStatsResource } from '../../../src/resources/game-stats';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('GameStatsResource', () => {
  let client: MockClient;
  let gameStats: GameStatsResource;

  beforeEach(() => {
    client = createMockClient();
    gameStats = new GameStatsResource(client);
  });

  // ---------------------------------------------------------------------------
  // listVersions
  // ---------------------------------------------------------------------------
  describe('listVersions', () => {
    it('calls get with /v1/game-stats/versions', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await gameStats.listVersions();
      expect(client.get).toHaveBeenCalledWith('/v1/game-stats/versions');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse([{ version: '1.0.0' }]);
      client.get.mockResolvedValue(expected);
      const result = await gameStats.listVersions();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // listFirearms
  // ---------------------------------------------------------------------------
  describe('listFirearms', () => {
    it('calls getPaginated with correct version path', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await gameStats.listFirearms('1.0.0');
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/game-stats/versions/1.0.0/firearms',
        undefined,
      );
    });

    it('forwards pagination params', async () => {
      const params = { per_page: 50 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await gameStats.listFirearms('1.0.0', params);
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/game-stats/versions/1.0.0/firearms',
        params,
      );
    });

    it('URL-encodes the version string', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await gameStats.listFirearms('2.0.0-beta 1');
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/game-stats/versions/2.0.0-beta%201/firearms',
        undefined,
      );
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ slug: 'glock-g17' }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await gameStats.listFirearms('1.0.0');
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // getFirearm
  // ---------------------------------------------------------------------------
  describe('getFirearm', () => {
    it('calls get with correct version and firearm path', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await gameStats.getFirearm('1.0.0', 'glock-g17');
      expect(client.get).toHaveBeenCalledWith(
        '/v1/game-stats/versions/1.0.0/firearms/glock-g17',
      );
    });

    it('URL-encodes both version and firearm id', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await gameStats.getFirearm('1.0.0 beta', 'a/b');
      expect(client.get).toHaveBeenCalledWith(
        '/v1/game-stats/versions/1.0.0%20beta/firearms/a%2Fb',
      );
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ slug: 'ak-47', damage: 75 });
      client.get.mockResolvedValue(expected);
      const result = await gameStats.getFirearm('1.0.0', 'ak-47');
      expect(result).toBe(expected);
    });
  });
});

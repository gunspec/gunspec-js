import { describe, it, expect, beforeEach } from 'vitest';
import { GameResource } from '../../../src/resources/game';
import {
  createMockClient,
  mockApiResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('GameResource', () => {
  let client: MockClient;
  let game: GameResource;

  beforeEach(() => {
    client = createMockClient();
    game = new GameResource(client);
  });

  // ---------------------------------------------------------------------------
  // balanceReport
  // ---------------------------------------------------------------------------
  describe('balanceReport', () => {
    it('calls get with /v1/game/balance-report and no params', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await game.balanceReport();
      expect(client.get).toHaveBeenCalledWith('/v1/game/balance-report', undefined);
    });

    it('forwards params', async () => {
      const params = { threshold: 15 };
      client.get.mockResolvedValue(mockApiResponse([]));
      await game.balanceReport(params);
      expect(client.get).toHaveBeenCalledWith('/v1/game/balance-report', params);
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse([{ name: 'outlier' }]);
      client.get.mockResolvedValue(expected);
      const result = await game.balanceReport();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // tierList
  // ---------------------------------------------------------------------------
  describe('tierList', () => {
    it('calls get with /v1/game/tier-list and no params', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await game.tierList();
      expect(client.get).toHaveBeenCalledWith('/v1/game/tier-list', undefined);
    });

    it('forwards params', async () => {
      const params = { stat: 'accuracy', category: 'rifle' };
      client.get.mockResolvedValue(mockApiResponse({}));
      await game.tierList(params);
      expect(client.get).toHaveBeenCalledWith('/v1/game/tier-list', params);
    });
  });

  // ---------------------------------------------------------------------------
  // matchups
  // ---------------------------------------------------------------------------
  describe('matchups', () => {
    it('calls get with /v1/game/matchups and params', async () => {
      const params = { a: 'ak-47', b: 'm4-carbine' };
      client.get.mockResolvedValue(mockApiResponse({ winner: 'ak-47' }));
      await game.matchups(params);
      expect(client.get).toHaveBeenCalledWith('/v1/game/matchups', params);
    });
  });

  // ---------------------------------------------------------------------------
  // roleRoster
  // ---------------------------------------------------------------------------
  describe('roleRoster', () => {
    it('calls get with /v1/game/role-roster and params', async () => {
      const params = { role: 'sniper', count: 10 };
      client.get.mockResolvedValue(mockApiResponse([]));
      await game.roleRoster(params);
      expect(client.get).toHaveBeenCalledWith('/v1/game/role-roster', params);
    });
  });

  // ---------------------------------------------------------------------------
  // statDistribution
  // ---------------------------------------------------------------------------
  describe('statDistribution', () => {
    it('calls get with /v1/game/stat-distribution and params', async () => {
      const params = { stat: 'damage' };
      client.get.mockResolvedValue(mockApiResponse({}));
      await game.statDistribution(params);
      expect(client.get).toHaveBeenCalledWith('/v1/game/stat-distribution', params);
    });
  });
});

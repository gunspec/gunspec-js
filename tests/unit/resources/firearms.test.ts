import { describe, it, expect, beforeEach } from 'vitest';
import { FirearmsResource } from '../../../src/resources/firearms';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('FirearmsResource', () => {
  let client: MockClient;
  let firearms: FirearmsResource;

  beforeEach(() => {
    client = createMockClient();
    firearms = new FirearmsResource(client);
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls getPaginated with correct path and no params', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.list();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms', undefined);
    });

    it('forwards query params', async () => {
      const params = { page: 2, per_page: 10, category: 'pistol' };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.list(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms', params);
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ slug: 'glock-g17' }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await firearms.list();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // listAutoPaging
  // ---------------------------------------------------------------------------
  describe('listAutoPaging', () => {
    it('yields all items across multiple pages', async () => {
      client.getPaginated
        .mockResolvedValueOnce(mockPaginatedResponse([{ slug: 'a' }, { slug: 'b' }], 1, 3))
        .mockResolvedValueOnce(mockPaginatedResponse([{ slug: 'c' }], 2, 3))
        .mockResolvedValueOnce(mockPaginatedResponse([{ slug: 'd' }], 3, 3));

      const items: unknown[] = [];
      for await (const item of firearms.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toEqual([
        { slug: 'a' },
        { slug: 'b' },
        { slug: 'c' },
        { slug: 'd' },
      ]);
      expect(client.getPaginated).toHaveBeenCalledTimes(3);
    });

    it('stops when totalPages is reached', async () => {
      client.getPaginated.mockResolvedValueOnce(
        mockPaginatedResponse([{ slug: 'only' }], 1, 1),
      );

      const items: unknown[] = [];
      for await (const item of firearms.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toHaveLength(1);
      expect(client.getPaginated).toHaveBeenCalledTimes(1);
    });

    it('stops when totalPages is undefined', async () => {
      const response = mockPaginatedResponse([{ slug: 'x' }], 1, 1);
      (response.pagination as Record<string, unknown>).totalPages = undefined;
      client.getPaginated.mockResolvedValueOnce(response);

      const items: unknown[] = [];
      for await (const item of firearms.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toHaveLength(1);
    });

    it('respects starting page from params', async () => {
      client.getPaginated.mockResolvedValueOnce(
        mockPaginatedResponse([{ slug: 'z' }], 3, 3),
      );

      const items: unknown[] = [];
      for await (const item of firearms.listAutoPaging({ page: 3 })) {
        items.push(item);
      }

      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms', expect.objectContaining({ page: 3 }));
    });
  });

  // ---------------------------------------------------------------------------
  // search
  // ---------------------------------------------------------------------------
  describe('search', () => {
    it('calls getPaginated with /v1/firearms/search', async () => {
      const params = { q: '9mm compact' };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.search(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/search', params);
    });
  });

  // ---------------------------------------------------------------------------
  // compare
  // ---------------------------------------------------------------------------
  describe('compare', () => {
    it('calls get with /v1/firearms/compare and params', async () => {
      const params = { ids: 'glock-g17,sig-sauer-p320' };
      client.get.mockResolvedValue(mockApiResponse({ items: [] }));
      await firearms.compare(params);
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/compare', params);
    });
  });

  // ---------------------------------------------------------------------------
  // gameMeta
  // ---------------------------------------------------------------------------
  describe('gameMeta', () => {
    it('calls get with /v1/firearms/game-meta', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await firearms.gameMeta();
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/game-meta', undefined);
    });

    it('forwards params', async () => {
      const params = { archetype: 'sniper' };
      client.get.mockResolvedValue(mockApiResponse([]));
      await firearms.gameMeta(params);
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/game-meta', params);
    });
  });

  // ---------------------------------------------------------------------------
  // actionTypes
  // ---------------------------------------------------------------------------
  describe('actionTypes', () => {
    it('calls get with /v1/firearms/action-types', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await firearms.actionTypes();
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/action-types');
    });
  });

  // ---------------------------------------------------------------------------
  // filterOptions
  // ---------------------------------------------------------------------------
  describe('filterOptions', () => {
    it('calls get with /v1/firearms/filter-options', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.filterOptions();
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/filter-options');
    });
  });

  // ---------------------------------------------------------------------------
  // random
  // ---------------------------------------------------------------------------
  describe('random', () => {
    it('calls get with /v1/firearms/random', async () => {
      client.get.mockResolvedValue(mockApiResponse({ slug: 'random-gun' }));
      await firearms.random();
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/random', undefined);
    });

    it('forwards params', async () => {
      const params = { category: 'pistol' };
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.random(params);
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/random', params);
    });
  });

  // ---------------------------------------------------------------------------
  // top
  // ---------------------------------------------------------------------------
  describe('top', () => {
    it('calls get with /v1/firearms/top and params', async () => {
      const params = { stat: 'lightest', category: 'pistol', limit: 5 };
      client.get.mockResolvedValue(mockApiResponse([]));
      await firearms.top(params);
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/top', params);
    });
  });

  // ---------------------------------------------------------------------------
  // headToHead
  // ---------------------------------------------------------------------------
  describe('headToHead', () => {
    it('calls get with /v1/firearms/head-to-head and params', async () => {
      const params = { a: 'glock-g17', b: 'sig-sauer-p320' };
      client.get.mockResolvedValue(mockApiResponse({ winner: 'glock-g17' }));
      await firearms.headToHead(params);
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/head-to-head', params);
    });
  });

  // ---------------------------------------------------------------------------
  // byFeature
  // ---------------------------------------------------------------------------
  describe('byFeature', () => {
    it('calls getPaginated with /v1/firearms/by-feature', async () => {
      const params = { feature: 'threaded-barrel' };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.byFeature(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/by-feature', params);
    });
  });

  // ---------------------------------------------------------------------------
  // byAction
  // ---------------------------------------------------------------------------
  describe('byAction', () => {
    it('calls getPaginated with /v1/firearms/by-action', async () => {
      const params = { action: 'semi-automatic' };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.byAction(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/by-action', params);
    });
  });

  // ---------------------------------------------------------------------------
  // byMaterial
  // ---------------------------------------------------------------------------
  describe('byMaterial', () => {
    it('calls getPaginated with /v1/firearms/by-material', async () => {
      const params = { material: 'polymer', component: 'frame' };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.byMaterial(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/by-material', params);
    });
  });

  // ---------------------------------------------------------------------------
  // byDesigner
  // ---------------------------------------------------------------------------
  describe('byDesigner', () => {
    it('calls getPaginated with /v1/firearms/by-designer', async () => {
      const params = { designer: 'John Browning' };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.byDesigner(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/by-designer', params);
    });
  });

  // ---------------------------------------------------------------------------
  // byConflict
  // ---------------------------------------------------------------------------
  describe('byConflict', () => {
    it('calls getPaginated with /v1/firearms/by-conflict', async () => {
      const params = { conflict: 'world-war-ii' };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.byConflict(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/by-conflict', params);
    });
  });

  // ---------------------------------------------------------------------------
  // powerRating
  // ---------------------------------------------------------------------------
  describe('powerRating', () => {
    it('calls getPaginated with /v1/firearms/power-rating', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.powerRating();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/power-rating', undefined);
    });

    it('forwards params', async () => {
      const params = { category: 'rifle' };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.powerRating(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/power-rating', params);
    });
  });

  // ---------------------------------------------------------------------------
  // timeline
  // ---------------------------------------------------------------------------
  describe('timeline', () => {
    it('calls getPaginated with /v1/firearms/timeline', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.timeline();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/timeline', undefined);
    });

    it('forwards year range params', async () => {
      const params = { from: 1900, to: 1950 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await firearms.timeline(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/timeline', params);
    });
  });

  // ---------------------------------------------------------------------------
  // get (single resource)
  // ---------------------------------------------------------------------------
  describe('get', () => {
    it('calls get with URL-encoded slug', async () => {
      client.get.mockResolvedValue(mockApiResponse({ slug: 'glock-g17' }));
      await firearms.get('glock-g17');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/glock-g17');
    });

    it('URL-encodes special characters in the id', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.get('foo/bar baz');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/foo%2Fbar%20baz');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ slug: 'ak-47' });
      client.get.mockResolvedValue(expected);
      const result = await firearms.get('ak-47');
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // getVariants
  // ---------------------------------------------------------------------------
  describe('getVariants', () => {
    it('calls get with /v1/firearms/:id/variants', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await firearms.getVariants('colt-1911');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/colt-1911/variants');
    });

    it('URL-encodes the id', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await firearms.getVariants('a/b');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/a%2Fb/variants');
    });
  });

  // ---------------------------------------------------------------------------
  // getImages
  // ---------------------------------------------------------------------------
  describe('getImages', () => {
    it('calls get with /v1/firearms/:id/images', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await firearms.getImages('sig-sauer-p226');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/sig-sauer-p226/images');
    });
  });

  // ---------------------------------------------------------------------------
  // getGameStats
  // ---------------------------------------------------------------------------
  describe('getGameStats', () => {
    it('calls get with /v1/firearms/:id/game-stats', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.getGameStats('ak-47');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/ak-47/game-stats');
    });
  });

  // ---------------------------------------------------------------------------
  // getDimensions
  // ---------------------------------------------------------------------------
  describe('getDimensions', () => {
    it('calls get with /v1/firearms/:id/dimensions', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.getDimensions('glock-g19');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/glock-g19/dimensions');
    });
  });

  // ---------------------------------------------------------------------------
  // getUsers
  // ---------------------------------------------------------------------------
  describe('getUsers', () => {
    it('calls get with /v1/firearms/:id/users', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await firearms.getUsers('beretta-m9');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/beretta-m9/users');
    });
  });

  // ---------------------------------------------------------------------------
  // getFamilyTree
  // ---------------------------------------------------------------------------
  describe('getFamilyTree', () => {
    it('calls get with /v1/firearms/:id/family-tree', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.getFamilyTree('m16a2');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/m16a2/family-tree');
    });
  });

  // ---------------------------------------------------------------------------
  // getSimilar
  // ---------------------------------------------------------------------------
  describe('getSimilar', () => {
    it('calls get with /v1/firearms/:id/similar', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await firearms.getSimilar('glock-g17');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/glock-g17/similar');
    });
  });

  // ---------------------------------------------------------------------------
  // getAdoptionMap
  // ---------------------------------------------------------------------------
  describe('getAdoptionMap', () => {
    it('calls get with /v1/firearms/:id/adoption-map', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.getAdoptionMap('fn-fal');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/fn-fal/adoption-map');
    });
  });

  // ---------------------------------------------------------------------------
  // getGameProfile
  // ---------------------------------------------------------------------------
  describe('getGameProfile', () => {
    it('calls get with /v1/firearms/:id/game-profile', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.getGameProfile('mp5');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/mp5/game-profile');
    });
  });

  // ---------------------------------------------------------------------------
  // getSilhouette
  // ---------------------------------------------------------------------------
  describe('getSilhouette', () => {
    it('calls get with /v1/firearms/:id/silhouette', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.getSilhouette('ak-47');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/ak-47/silhouette', undefined);
    });

    it('forwards params', async () => {
      const params = { format: 'datauri', stroke_width: 2, stroke_color: '#333' };
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.getSilhouette('ak-47', params);
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/ak-47/silhouette', params);
    });

    it('URL-encodes the id', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.getSilhouette('a b');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/a%20b/silhouette', undefined);
    });
  });

  // ---------------------------------------------------------------------------
  // calculate
  // ---------------------------------------------------------------------------
  describe('calculate', () => {
    it('calls get with /v1/firearms/:id/calculate and params', async () => {
      const params = { ammo_id: '9mm-federal-hst-124gr' };
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.calculate('glock-g17', params);
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/glock-g17/calculate', params);
    });

    it('URL-encodes the id', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.calculate('a/b', { ammo_id: 'test' });
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/a%2Fb/calculate', { ammo_id: 'test' });
    });
  });

  // ---------------------------------------------------------------------------
  // load
  // ---------------------------------------------------------------------------
  describe('load', () => {
    it('calls get with /v1/firearms/:id/load', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.load('sig-sauer-p226');
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/sig-sauer-p226/load', undefined);
    });

    it('forwards ammo_id param', async () => {
      const params = { ammo_id: '9mm-winchester-ranger-147gr' };
      client.get.mockResolvedValue(mockApiResponse({}));
      await firearms.load('sig-sauer-p226', params);
      expect(client.get).toHaveBeenCalledWith('/v1/firearms/sig-sauer-p226/load', params);
    });
  });
});

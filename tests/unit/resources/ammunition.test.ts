import { describe, it, expect, beforeEach } from 'vitest';
import { AmmunitionResource } from '../../../src/resources/ammunition';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('AmmunitionResource', () => {
  let client: MockClient;
  let ammunition: AmmunitionResource;

  beforeEach(() => {
    client = createMockClient();
    ammunition = new AmmunitionResource(client);
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls getPaginated with correct path and no params', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await ammunition.list();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/ammunition', undefined);
    });

    it('forwards query params', async () => {
      const params = { caliber_id: '9x19mm-parabellum', bullet_type: 'hollow-point', per_page: 25 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await ammunition.list(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/ammunition', params);
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ slug: '9mm-hst' }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await ammunition.list();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // listAutoPaging
  // ---------------------------------------------------------------------------
  describe('listAutoPaging', () => {
    it('yields all items across multiple pages', async () => {
      client.getPaginated
        .mockResolvedValueOnce(mockPaginatedResponse([{ slug: 'ammo-a' }, { slug: 'ammo-b' }], 1, 2))
        .mockResolvedValueOnce(mockPaginatedResponse([{ slug: 'ammo-c' }], 2, 2));

      const items: unknown[] = [];
      for await (const item of ammunition.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toEqual([{ slug: 'ammo-a' }, { slug: 'ammo-b' }, { slug: 'ammo-c' }]);
      expect(client.getPaginated).toHaveBeenCalledTimes(2);
    });

    it('stops when totalPages is reached on single page', async () => {
      client.getPaginated.mockResolvedValueOnce(
        mockPaginatedResponse([{ slug: 'only' }], 1, 1),
      );

      const items: unknown[] = [];
      for await (const item of ammunition.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toHaveLength(1);
      expect(client.getPaginated).toHaveBeenCalledTimes(1);
    });

    it('stops when totalPages is undefined (falsy)', async () => {
      const response = mockPaginatedResponse([{ slug: 'x' }], 1, 1);
      (response.pagination as Record<string, unknown>).totalPages = undefined;
      client.getPaginated.mockResolvedValueOnce(response);

      const items: unknown[] = [];
      for await (const item of ammunition.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toHaveLength(1);
    });

    it('respects starting page from params', async () => {
      client.getPaginated.mockResolvedValueOnce(
        mockPaginatedResponse([{ slug: 'z' }], 3, 3),
      );

      const items: unknown[] = [];
      for await (const item of ammunition.listAutoPaging({ page: 3 })) {
        items.push(item);
      }

      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/ammunition',
        expect.objectContaining({ page: 3 }),
      );
    });

    it('forwards filter params along with page', async () => {
      client.getPaginated.mockResolvedValueOnce(
        mockPaginatedResponse([{ slug: 'ammo-x' }], 1, 1),
      );

      const items: unknown[] = [];
      for await (const item of ammunition.listAutoPaging({ caliber_id: '45-acp' })) {
        items.push(item);
      }

      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/ammunition',
        expect.objectContaining({ caliber_id: '45-acp', page: 1 }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // get
  // ---------------------------------------------------------------------------
  describe('get', () => {
    it('calls get with URL-encoded slug', async () => {
      client.get.mockResolvedValue(mockApiResponse({ slug: '9mm-federal-hst-124gr' }));
      await ammunition.get('9mm-federal-hst-124gr');
      expect(client.get).toHaveBeenCalledWith('/v1/ammunition/9mm-federal-hst-124gr');
    });

    it('URL-encodes special characters', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await ammunition.get('a/b c');
      expect(client.get).toHaveBeenCalledWith('/v1/ammunition/a%2Fb%20c');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ slug: 'test' });
      client.get.mockResolvedValue(expected);
      const result = await ammunition.get('test');
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // getBulletSvg
  // ---------------------------------------------------------------------------
  describe('getBulletSvg', () => {
    it('reads the SVG as text, not as an envelope', async () => {
      const svgString = '<svg>...</svg>';
      client.getText.mockResolvedValue(svgString);
      await ammunition.getBulletSvg('9mm-federal-hst-124gr');
      expect(client.getText).toHaveBeenCalledWith('/v1/ammunition/9mm-federal-hst-124gr/bullet.svg');
      expect(client.get).not.toHaveBeenCalled();
    });

    it('returns the SVG string', async () => {
      const svgString = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>';
      client.getText.mockResolvedValue(svgString);
      const result = await ammunition.getBulletSvg('9mm-federal-hst-124gr');
      expect(result).toBe(svgString);
    });

    it('URL-encodes the id', async () => {
      client.getText.mockResolvedValue('<svg/>');
      await ammunition.getBulletSvg('a/b');
      expect(client.getText).toHaveBeenCalledWith('/v1/ammunition/a%2Fb/bullet.svg');
    });
  });

  // ---------------------------------------------------------------------------
  // ballistics
  // ---------------------------------------------------------------------------
  describe('ballistics', () => {
    it('calls get with /v1/ammunition/:id/ballistics and no params', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await ammunition.ballistics('9mm-federal-hst-124gr');
      expect(client.get).toHaveBeenCalledWith(
        '/v1/ammunition/9mm-federal-hst-124gr/ballistics',
        undefined,
      );
    });

    it('forwards params', async () => {
      const params = { barrel_length_mm: 102, distances: '0,25,50,100,200' };
      client.get.mockResolvedValue(mockApiResponse({}));
      await ammunition.ballistics('9mm-federal-hst-124gr', params);
      expect(client.get).toHaveBeenCalledWith(
        '/v1/ammunition/9mm-federal-hst-124gr/ballistics',
        params,
      );
    });

    it('URL-encodes the id', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await ammunition.ballistics('a/b');
      expect(client.get).toHaveBeenCalledWith('/v1/ammunition/a%2Fb/ballistics', undefined);
    });
  });
});

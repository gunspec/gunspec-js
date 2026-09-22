import { describe, it, expect, beforeEach } from 'vitest';
import { ManufacturersResource } from '../../../src/resources/manufacturers';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('ManufacturersResource', () => {
  let client: MockClient;
  let manufacturers: ManufacturersResource;

  beforeEach(() => {
    client = createMockClient();
    manufacturers = new ManufacturersResource(client);
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls getPaginated with correct path and no params', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await manufacturers.list();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/manufacturers', undefined);
    });

    it('forwards query params', async () => {
      const params = { country: 'US', sort: 'name', order: 'asc', per_page: 50 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await manufacturers.list(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/manufacturers', params);
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ slug: 'glock' }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await manufacturers.list();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // listAutoPaging
  // ---------------------------------------------------------------------------
  describe('listAutoPaging', () => {
    it('yields all items across multiple pages', async () => {
      client.getPaginated
        .mockResolvedValueOnce(mockPaginatedResponse([{ slug: 'glock' }], 1, 2))
        .mockResolvedValueOnce(mockPaginatedResponse([{ slug: 'beretta' }], 2, 2));

      const items: unknown[] = [];
      for await (const item of manufacturers.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toEqual([{ slug: 'glock' }, { slug: 'beretta' }]);
      expect(client.getPaginated).toHaveBeenCalledTimes(2);
    });

    it('stops on single page', async () => {
      client.getPaginated.mockResolvedValueOnce(
        mockPaginatedResponse([{ slug: 'colt' }], 1, 1),
      );

      const items: unknown[] = [];
      for await (const item of manufacturers.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toHaveLength(1);
      expect(client.getPaginated).toHaveBeenCalledTimes(1);
    });

    it('respects starting page from params', async () => {
      client.getPaginated.mockResolvedValueOnce(
        mockPaginatedResponse([{ slug: 'sig' }], 2, 2),
      );

      const items: unknown[] = [];
      for await (const item of manufacturers.listAutoPaging({ page: 2 })) {
        items.push(item);
      }

      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/manufacturers',
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // get
  // ---------------------------------------------------------------------------
  describe('get', () => {
    it('calls get with URL-encoded slug', async () => {
      client.get.mockResolvedValue(mockApiResponse({ slug: 'beretta' }));
      await manufacturers.get('beretta');
      expect(client.get).toHaveBeenCalledWith('/v1/manufacturers/beretta');
    });

    it('URL-encodes special characters', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await manufacturers.get('heckler & koch');
      expect(client.get).toHaveBeenCalledWith('/v1/manufacturers/heckler%20%26%20koch');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ slug: 'sig-sauer' });
      client.get.mockResolvedValue(expected);
      const result = await manufacturers.get('sig-sauer');
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // getFirearms
  // ---------------------------------------------------------------------------
  describe('getFirearms', () => {
    it('calls getPaginated with /v1/manufacturers/:id/firearms', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await manufacturers.getFirearms('colt');
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/manufacturers/colt/firearms',
        undefined,
      );
    });

    it('forwards pagination params', async () => {
      const params = { per_page: 50 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await manufacturers.getFirearms('colt', params);
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/manufacturers/colt/firearms',
        params,
      );
    });

    it('URL-encodes the manufacturer id', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await manufacturers.getFirearms('smith & wesson');
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/manufacturers/smith%20%26%20wesson/firearms',
        undefined,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getTimeline
  // ---------------------------------------------------------------------------
  describe('getTimeline', () => {
    it('calls get with /v1/manufacturers/:id/timeline', async () => {
      client.get.mockResolvedValue(mockApiResponse({ events: [] }));
      await manufacturers.getTimeline('browning');
      expect(client.get).toHaveBeenCalledWith('/v1/manufacturers/browning/timeline');
    });

    it('URL-encodes the manufacturer id', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await manufacturers.getTimeline('a/b');
      expect(client.get).toHaveBeenCalledWith('/v1/manufacturers/a%2Fb/timeline');
    });
  });

  // ---------------------------------------------------------------------------
  // getStats
  // ---------------------------------------------------------------------------
  describe('getStats', () => {
    it('calls get with /v1/manufacturers/:id/stats', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await manufacturers.getStats('glock');
      expect(client.get).toHaveBeenCalledWith('/v1/manufacturers/glock/stats');
    });

    it('URL-encodes the manufacturer id', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await manufacturers.getStats('a b');
      expect(client.get).toHaveBeenCalledWith('/v1/manufacturers/a%20b/stats');
    });
  });
});

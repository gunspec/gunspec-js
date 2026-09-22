import { describe, it, expect, beforeEach } from 'vitest';
import { CalibersResource } from '../../../src/resources/calibers';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('CalibersResource', () => {
  let client: MockClient;
  let calibers: CalibersResource;

  beforeEach(() => {
    client = createMockClient();
    calibers = new CalibersResource(client);
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls getPaginated with correct path and no params', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await calibers.list();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/calibers', undefined);
    });

    it('forwards query params', async () => {
      const params = { cartridge_type: 'centerfire', primer_type: 'boxer', per_page: 50 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await calibers.list(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/calibers', params);
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ slug: '9mm' }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await calibers.list();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // listAutoPaging
  // ---------------------------------------------------------------------------
  describe('listAutoPaging', () => {
    it('yields all items across multiple pages', async () => {
      client.getPaginated
        .mockResolvedValueOnce(mockPaginatedResponse([{ slug: '9mm' }], 1, 3))
        .mockResolvedValueOnce(mockPaginatedResponse([{ slug: '45-acp' }], 2, 3))
        .mockResolvedValueOnce(mockPaginatedResponse([{ slug: '5.56' }], 3, 3));

      const items: unknown[] = [];
      for await (const item of calibers.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toEqual([{ slug: '9mm' }, { slug: '45-acp' }, { slug: '5.56' }]);
      expect(client.getPaginated).toHaveBeenCalledTimes(3);
    });

    it('stops when totalPages is reached', async () => {
      client.getPaginated.mockResolvedValueOnce(
        mockPaginatedResponse([{ slug: 'only-one' }], 1, 1),
      );

      const items: unknown[] = [];
      for await (const item of calibers.listAutoPaging()) {
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
      for await (const item of calibers.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toHaveLength(1);
    });

    it('respects starting page from params', async () => {
      client.getPaginated.mockResolvedValueOnce(
        mockPaginatedResponse([{ slug: 'z' }], 2, 2),
      );

      const items: unknown[] = [];
      for await (const item of calibers.listAutoPaging({ page: 2 })) {
        items.push(item);
      }

      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/calibers',
        expect.objectContaining({ page: 2 }),
      );
    });

    it('yields nothing for empty first page with no more pages', async () => {
      client.getPaginated.mockResolvedValueOnce(
        mockPaginatedResponse([], 1, 1),
      );

      const items: unknown[] = [];
      for await (const item of calibers.listAutoPaging()) {
        items.push(item);
      }

      expect(items).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // compare
  // ---------------------------------------------------------------------------
  describe('compare', () => {
    it('calls get with /v1/calibers/compare and params', async () => {
      const params = { ids: '9x19mm-parabellum,45-acp' };
      client.get.mockResolvedValue(mockApiResponse([]));
      await calibers.compare(params);
      expect(client.get).toHaveBeenCalledWith('/v1/calibers/compare', params);
    });
  });

  // ---------------------------------------------------------------------------
  // ballistics
  // ---------------------------------------------------------------------------
  describe('ballistics', () => {
    it('calls get with /v1/calibers/ballistics and params', async () => {
      const params = { id: '9x19mm-parabellum', distance: 100 };
      client.get.mockResolvedValue(mockApiResponse({}));
      await calibers.ballistics(params);
      expect(client.get).toHaveBeenCalledWith('/v1/calibers/ballistics', params);
    });
  });

  // ---------------------------------------------------------------------------
  // get
  // ---------------------------------------------------------------------------
  describe('get', () => {
    it('calls get with URL-encoded slug', async () => {
      client.get.mockResolvedValue(mockApiResponse({ slug: '45-acp' }));
      await calibers.get('45-acp');
      expect(client.get).toHaveBeenCalledWith('/v1/calibers/45-acp');
    });

    it('URL-encodes special characters', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await calibers.get('.300 blackout');
      expect(client.get).toHaveBeenCalledWith('/v1/calibers/.300%20blackout');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ slug: '9mm' });
      client.get.mockResolvedValue(expected);
      const result = await calibers.get('9mm');
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // getFirearms
  // ---------------------------------------------------------------------------
  describe('getFirearms', () => {
    it('calls getPaginated with /v1/calibers/:id/firearms', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await calibers.getFirearms('9x19mm-parabellum');
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/calibers/9x19mm-parabellum/firearms',
        undefined,
      );
    });

    it('forwards pagination params', async () => {
      const params = { per_page: 50 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await calibers.getFirearms('9x19mm-parabellum', params);
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/calibers/9x19mm-parabellum/firearms',
        params,
      );
    });

    it('URL-encodes the caliber id', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await calibers.getFirearms('a/b');
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/calibers/a%2Fb/firearms',
        undefined,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getParentChain
  // ---------------------------------------------------------------------------
  describe('getParentChain', () => {
    it('calls get with /v1/calibers/:id/parent-chain', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await calibers.getParentChain('300-blackout');
      expect(client.get).toHaveBeenCalledWith('/v1/calibers/300-blackout/parent-chain');
    });

    it('URL-encodes the caliber id', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await calibers.getParentChain('a/b');
      expect(client.get).toHaveBeenCalledWith('/v1/calibers/a%2Fb/parent-chain');
    });
  });

  // ---------------------------------------------------------------------------
  // getFamily
  // ---------------------------------------------------------------------------
  describe('getFamily', () => {
    it('calls get with /v1/calibers/:id/family', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await calibers.getFamily('9x19mm-parabellum');
      expect(client.get).toHaveBeenCalledWith('/v1/calibers/9x19mm-parabellum/family');
    });
  });

  // ---------------------------------------------------------------------------
  // getAmmunition
  // ---------------------------------------------------------------------------
  describe('getAmmunition', () => {
    it('calls getPaginated with /v1/calibers/:id/ammunition', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await calibers.getAmmunition('9x19mm-parabellum');
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/calibers/9x19mm-parabellum/ammunition',
        undefined,
      );
    });

    it('forwards pagination params', async () => {
      const params = { per_page: 25 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await calibers.getAmmunition('9x19mm-parabellum', params);
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/calibers/9x19mm-parabellum/ammunition',
        params,
      );
    });

    it('URL-encodes the caliber id', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await calibers.getAmmunition('a/b');
      expect(client.getPaginated).toHaveBeenCalledWith(
        '/v1/calibers/a%2Fb/ammunition',
        undefined,
      );
    });
  });
});

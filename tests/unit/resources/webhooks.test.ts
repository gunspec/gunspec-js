import { describe, it, expect, beforeEach } from 'vitest';
import { WebhooksResource } from '../../../src/resources/webhooks';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('WebhooksResource', () => {
  let client: MockClient;
  let webhooks: WebhooksResource;

  beforeEach(() => {
    client = createMockClient();
    webhooks = new WebhooksResource(client);
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls getPaginated with /v1/me/webhooks and no params', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await webhooks.list();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/me/webhooks', undefined);
    });

    it('forwards query params', async () => {
      const params = { page: 2, per_page: 5 };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await webhooks.list(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/me/webhooks', params);
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ id: 'wh-1', url: 'https://example.com' }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await webhooks.list();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('calls post with /v1/me/webhooks and params body', async () => {
      const params = { url: 'https://example.com/hook', events: ['firearm.created'] };
      client.post.mockResolvedValue(mockApiResponse({ id: 'wh-1' }));
      await webhooks.create(params);
      expect(client.post).toHaveBeenCalledWith('/v1/me/webhooks', params);
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ id: 'wh-1', url: 'https://example.com/hook' });
      client.post.mockResolvedValue(expected);
      const result = await webhooks.create({ url: 'https://example.com/hook', events: [] });
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // get
  // ---------------------------------------------------------------------------
  describe('get', () => {
    it('calls get with /v1/me/webhooks/:id', async () => {
      client.get.mockResolvedValue(mockApiResponse({ id: 'wh-1' }));
      await webhooks.get('wh-1');
      expect(client.get).toHaveBeenCalledWith('/v1/me/webhooks/wh-1');
    });

    it('URL-encodes the id', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await webhooks.get('a/b');
      expect(client.get).toHaveBeenCalledWith('/v1/me/webhooks/a%2Fb');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ id: 'wh-1', url: 'https://example.com' });
      client.get.mockResolvedValue(expected);
      const result = await webhooks.get('wh-1');
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('calls put with /v1/me/webhooks/:id and params body', async () => {
      const params = { url: 'https://example.com/updated', events: ['firearm.updated'] };
      client.put.mockResolvedValue(mockApiResponse({ id: 'wh-1' }));
      await webhooks.update('wh-1', params);
      expect(client.put).toHaveBeenCalledWith('/v1/me/webhooks/wh-1', params);
    });

    it('URL-encodes the id', async () => {
      client.put.mockResolvedValue(mockApiResponse({}));
      await webhooks.update('a/b', { url: 'https://test.com' });
      expect(client.put).toHaveBeenCalledWith('/v1/me/webhooks/a%2Fb', { url: 'https://test.com' });
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ id: 'wh-1', url: 'https://updated.com' });
      client.put.mockResolvedValue(expected);
      const result = await webhooks.update('wh-1', { url: 'https://updated.com' });
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('calls delete with /v1/me/webhooks/:id', async () => {
      client.delete.mockResolvedValue(mockApiResponse({ deleted: true }));
      await webhooks.delete('wh-1');
      expect(client.delete).toHaveBeenCalledWith('/v1/me/webhooks/wh-1');
    });

    it('URL-encodes the id', async () => {
      client.delete.mockResolvedValue(mockApiResponse({ deleted: true }));
      await webhooks.delete('a/b');
      expect(client.delete).toHaveBeenCalledWith('/v1/me/webhooks/a%2Fb');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ deleted: true });
      client.delete.mockResolvedValue(expected);
      const result = await webhooks.delete('wh-1');
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // test
  // ---------------------------------------------------------------------------
  describe('test', () => {
    it('calls post with /v1/me/webhooks/:id/test', async () => {
      client.post.mockResolvedValue(mockApiResponse({ success: true, statusCode: 200 }));
      await webhooks.test('wh-1');
      expect(client.post).toHaveBeenCalledWith('/v1/me/webhooks/wh-1/test');
    });

    it('URL-encodes the id', async () => {
      client.post.mockResolvedValue(mockApiResponse({}));
      await webhooks.test('a/b');
      expect(client.post).toHaveBeenCalledWith('/v1/me/webhooks/a%2Fb/test');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ success: true, statusCode: 200 });
      client.post.mockResolvedValue(expected);
      const result = await webhooks.test('wh-1');
      expect(result).toBe(expected);
    });
  });
});

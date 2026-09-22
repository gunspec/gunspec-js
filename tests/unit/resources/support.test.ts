import { describe, it, expect, beforeEach } from 'vitest';
import { SupportResource } from '../../../src/resources/support';
import {
  createMockClient,
  mockApiResponse,
  mockPaginatedResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('SupportResource', () => {
  let client: MockClient;
  let support: SupportResource;

  beforeEach(() => {
    client = createMockClient();
    support = new SupportResource(client);
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('calls post with /v1/me/support and params body', async () => {
      const params = { subject: 'Help', message: 'I need help' };
      client.post.mockResolvedValue(mockApiResponse({ id: 'tkt-1' }));
      await support.create(params);
      expect(client.post).toHaveBeenCalledWith('/v1/me/support', params);
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ id: 'tkt-1', status: 'open' });
      client.post.mockResolvedValue(expected);
      const result = await support.create({ subject: 'test', message: 'test' });
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls getPaginated with /v1/me/support and no params', async () => {
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await support.list();
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/me/support', undefined);
    });

    it('forwards query params', async () => {
      const params = { page: 1, per_page: 10, status: 'open' };
      client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
      await support.list(params);
      expect(client.getPaginated).toHaveBeenCalledWith('/v1/me/support', params);
    });

    it('returns the paginated response as-is', async () => {
      const expected = mockPaginatedResponse([{ id: 'tkt-1' }]);
      client.getPaginated.mockResolvedValue(expected);
      const result = await support.list();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // get
  // ---------------------------------------------------------------------------
  describe('get', () => {
    it('calls get with /v1/me/support/:ticketId', async () => {
      client.get.mockResolvedValue(mockApiResponse({ id: 'tkt-1' }));
      await support.get('tkt-1');
      expect(client.get).toHaveBeenCalledWith('/v1/me/support/tkt-1');
    });

    it('URL-encodes the ticket id', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await support.get('a/b');
      expect(client.get).toHaveBeenCalledWith('/v1/me/support/a%2Fb');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ id: 'tkt-1', replies: [] });
      client.get.mockResolvedValue(expected);
      const result = await support.get('tkt-1');
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // reply
  // ---------------------------------------------------------------------------
  describe('reply', () => {
    it('calls post with /v1/me/support/:ticketId/replies and body', async () => {
      const params = { message: 'Thanks for the help' };
      client.post.mockResolvedValue(mockApiResponse({ id: 'reply-1' }));
      await support.reply('tkt-1', params);
      expect(client.post).toHaveBeenCalledWith('/v1/me/support/tkt-1/replies', params);
    });

    it('URL-encodes the ticket id', async () => {
      client.post.mockResolvedValue(mockApiResponse({}));
      await support.reply('a/b', { message: 'test' });
      expect(client.post).toHaveBeenCalledWith('/v1/me/support/a%2Fb/replies', { message: 'test' });
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ id: 'reply-1', message: 'ok' });
      client.post.mockResolvedValue(expected);
      const result = await support.reply('tkt-1', { message: 'ok' });
      expect(result).toBe(expected);
    });
  });
});

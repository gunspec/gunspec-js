import { describe, it, expect, beforeEach } from 'vitest';
import { DocsResource } from '../../../src/resources/docs';
import {
  createMockClient,
  mockApiResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('DocsResource', () => {
  let client: MockClient;
  let docs: DocsResource;

  beforeEach(() => {
    client = createMockClient();
    docs = new DocsResource(client);
  });

  describe('getOperations', () => {
    it('calls get with /v1/docs/operations and forwards path and method', async () => {
      client.get.mockResolvedValue(mockApiResponse({ matched: 'exact', operations: [] }));
      const params = { path: '/v1/firearms/{id}', method: 'GET' as const };
      await docs.getOperations(params);
      expect(client.get).toHaveBeenCalledWith('/v1/docs/operations', params);
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ matched: 'prefix', specVersion: '1.0.0', operations: [] });
      client.get.mockResolvedValue(expected);
      expect(await docs.getOperations({ path: '/v1/vendor' })).toBe(expected);
    });
  });

  describe('getSample', () => {
    it('calls get with /v1/docs/samples and forwards the language', async () => {
      client.get.mockResolvedValue(mockApiResponse({ samples: [] }));
      const params = { path: '/v1/firearms', method: 'GET' as const, language: 'sdk-python' as const };
      await docs.getSample(params);
      expect(client.get).toHaveBeenCalledWith('/v1/docs/samples', params);
    });
  });

  describe('getLimits', () => {
    it('calls get with /v1/docs/limits and no params', async () => {
      client.get.mockResolvedValue(mockApiResponse({ plans: [] }));
      await docs.getLimits();
      expect(client.get).toHaveBeenCalledWith('/v1/docs/limits');
    });
  });
});

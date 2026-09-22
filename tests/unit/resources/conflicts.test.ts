import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictsResource } from '../../../src/resources/conflicts';
import {
  createMockClient,
  mockApiResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('ConflictsResource', () => {
  let client: MockClient;
  let conflicts: ConflictsResource;

  beforeEach(() => {
    client = createMockClient();
    conflicts = new ConflictsResource(client);
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls get with /v1/conflicts', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await conflicts.list();
      expect(client.get).toHaveBeenCalledWith('/v1/conflicts');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse([
        { name: 'World War II', startYear: 1939, endYear: 1945 },
      ]);
      client.get.mockResolvedValue(expected);
      const result = await conflicts.list();
      expect(result).toBe(expected);
    });
  });
});

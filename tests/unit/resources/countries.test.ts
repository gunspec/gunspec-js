import { describe, it, expect, beforeEach } from 'vitest';
import { CountriesResource } from '../../../src/resources/countries';
import {
  createMockClient,
  mockApiResponse,
  type MockClient,
} from '../../helpers/mock-client';

describe('CountriesResource', () => {
  let client: MockClient;
  let countries: CountriesResource;

  beforeEach(() => {
    client = createMockClient();
    countries = new CountriesResource(client);
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('calls get with /v1/countries', async () => {
      client.get.mockResolvedValue(mockApiResponse([]));
      await countries.list();
      expect(client.get).toHaveBeenCalledWith('/v1/countries');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse([{ code: 'US', name: 'United States' }]);
      client.get.mockResolvedValue(expected);
      const result = await countries.list();
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // getArsenal
  // ---------------------------------------------------------------------------
  describe('getArsenal', () => {
    it('calls get with /v1/countries/:code/arsenal', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await countries.getArsenal('US');
      expect(client.get).toHaveBeenCalledWith('/v1/countries/US/arsenal');
    });

    it('URL-encodes the country code', async () => {
      client.get.mockResolvedValue(mockApiResponse({}));
      await countries.getArsenal('a b');
      expect(client.get).toHaveBeenCalledWith('/v1/countries/a%20b/arsenal');
    });

    it('returns the response as-is', async () => {
      const expected = mockApiResponse({ country: { code: 'GB' }, totalFirearms: 42 });
      client.get.mockResolvedValue(expected);
      const result = await countries.getArsenal('GB');
      expect(result).toBe(expected);
    });
  });
});

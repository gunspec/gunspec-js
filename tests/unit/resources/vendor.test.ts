import { describe, it, expect, beforeEach } from 'vitest';
import { VendorResource } from '../../../src/resources/vendor';
import { createMockClient, mockApiResponse, mockPaginatedResponse, type MockClient } from '../../helpers/mock-client';

describe('VendorResource', () => {
  let client: MockClient;
  let vendor: VendorResource;

  beforeEach(() => {
    client = createMockClient();
    vendor = new VendorResource(client);
  });

  it('shops reads /v1/vendor/shops', async () => {
    client.get.mockResolvedValue(mockApiResponse([]));
    await vendor.shops();
    expect(client.get).toHaveBeenCalledWith('/v1/vendor/shops');
  });

  it('listOffers pages with filters', async () => {
    client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
    const params = { vendor: 'shop_1', status: 'published' as const, q: 'sku' };
    await vendor.listOffers(params);
    expect(client.getPaginated).toHaveBeenCalledWith('/v1/vendor/offers', params);
  });

  it('pushOffers PUTs the batch and carries the shop selector in the query', async () => {
    client.put.mockResolvedValue(mockApiResponse({ written: 1, unmatched: [] }));
    const body = { offers: [{ sku: 'A1', attachment_id: 'x', price_cents: 1999, currency: 'AUD', url: 'https://shop.example/a1' }] };
    await vendor.pushOffers(body, { vendor: 'shop_1' });
    expect(client.put).toHaveBeenCalledWith('/v1/vendor/offers', body, { vendor: 'shop_1' });
  });

  it('updateOffer PATCHes one SKU, URL-encoded', async () => {
    client.patch.mockResolvedValue(mockApiResponse({ sku: 'A/1' }));
    await vendor.updateOffer('A/1', { price_cents: 1899 });
    expect(client.patch).toHaveBeenCalledWith('/v1/vendor/offers/A%2F1', { price_cents: 1899 }, undefined);
  });

  it('deleteOffer withdraws one SKU', async () => {
    client.delete.mockResolvedValue(mockApiResponse({ removed: true }));
    await vendor.deleteOffer('A1', { vendor: 'shop_2' });
    expect(client.delete).toHaveBeenCalledWith('/v1/vendor/offers/A1', { vendor: 'shop_2' });
  });

  it('clickUrl builds the tracked outbound link without a request', () => {
    expect(vendor.clickUrl('clk_abc')).toBe('https://api.gunspec.io/v1/out/clk_abc');
    expect(vendor.clickUrl('clk/abc', 'de')).toBe('https://api.gunspec.io/v1/out/clk%2Fabc?l=de');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('resolveClick asks the transport for the redirect target', async () => {
    client.resolveRedirect.mockResolvedValue('https://shop.example/x');
    expect(await vendor.resolveClick('clk_abc')).toBe('https://shop.example/x');
    expect(client.resolveRedirect).toHaveBeenCalledWith('/v1/out/clk_abc');
  });
});

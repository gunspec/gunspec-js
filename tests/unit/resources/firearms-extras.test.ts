import { describe, it, expect, beforeEach } from 'vitest';
import { FirearmsResource } from '../../../src/resources/firearms';
import { ContentResource } from '../../../src/resources/content';
import { createMockClient, mockApiResponse, mockPaginatedResponse, mockRawResponse, type MockClient } from '../../helpers/mock-client';

describe('FirearmsResource extras', () => {
  let client: MockClient;
  let firearms: FirearmsResource;

  beforeEach(() => {
    client = createMockClient();
    firearms = new FirearmsResource(client);
  });

  it('resolve GETs with q', async () => {
    client.get.mockResolvedValue(mockApiResponse({ status: 'resolved' }));
    await firearms.resolve('G19 gen 5');
    expect(client.get).toHaveBeenCalledWith('/v1/firearms/resolve', { q: 'G19 gen 5' });
  });

  it('resolveMany POSTs the batch', async () => {
    client.post.mockResolvedValue(mockApiResponse({ results: [] }));
    await firearms.resolveMany(['a', 'b']);
    expect(client.post).toHaveBeenCalledWith('/v1/firearms/resolve', { queries: ['a', 'b'] });
  });

  it('mediaCatalog pages the media index', async () => {
    client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
    await firearms.mediaCatalog({ kind: 'photo', per_page: 50 });
    expect(client.getPaginated).toHaveBeenCalledWith('/v1/firearms/media', { kind: 'photo', per_page: 50 });
  });

  it('listMedia and getMedia address one firearm', async () => {
    client.get.mockResolvedValue(mockApiResponse([]));
    await firearms.listMedia('ak-47', { kind: 'silhouette' });
    expect(client.get).toHaveBeenCalledWith('/v1/firearms/ak-47/media', { kind: 'silhouette' });

    await firearms.getMedia('ak-47', 'silhouette', { stroke_width: 2 });
    expect(client.get).toHaveBeenCalledWith('/v1/firearms/ak-47/media/silhouette', { stroke_width: 2, format: 'json' });

    await firearms.getMedia('ak-47', 12);
    expect(client.get).toHaveBeenCalledWith('/v1/firearms/ak-47/media/12', { format: 'json' });
  });

  it('downloadMedia and getModel read bytes', async () => {
    client.getBytes.mockResolvedValue(mockRawResponse('bytes'));
    await firearms.downloadMedia('ak-47', 'render', { size: 'thumb' });
    expect(client.getBytes).toHaveBeenCalledWith('/v1/firearms/ak-47/media/render', { size: 'thumb', format: 'raw' });

    await firearms.getModel('ak/47');
    expect(client.getBytes).toHaveBeenCalledWith('/v1/firearms/ak%2F47/model');
  });

  it('getImageAsset asks for a data URI', async () => {
    client.get.mockResolvedValue(mockApiResponse({ dataUri: 'data:image/webp;base64,AA==' }));
    await firearms.getImageAsset('ak-47', 7, { variant: 'thumb' });
    expect(client.get).toHaveBeenCalledWith('/v1/firearms/ak-47/images/7', { variant: 'thumb', format: 'datauri' });
  });

  it('getOffers, getInterfaces and getAttachments hit their paths', async () => {
    client.get.mockResolvedValue(mockApiResponse({}));
    await firearms.getOffers('ak-47', { region: 'DE' });
    expect(client.get).toHaveBeenCalledWith('/v1/firearms/ak-47/offers', { region: 'DE' });

    await firearms.getInterfaces('ak-47');
    expect(client.get).toHaveBeenCalledWith('/v1/firearms/ak-47/interfaces');

    await firearms.getAttachments('ak-47', { include: 'all', with_offers: true });
    expect(client.get).toHaveBeenCalledWith('/v1/firearms/ak-47/attachments', { include: 'all', with_offers: true });
  });
});

describe('ContentResource notices', () => {
  it('listNotices reads /v1/notices', async () => {
    const client = createMockClient();
    client.get.mockResolvedValue(mockApiResponse({ notices: [] }));
    const content = new ContentResource(client);
    const res = await content.listNotices();
    expect(client.get).toHaveBeenCalledWith('/v1/notices');
    expect(res.data.notices).toEqual([]);
  });
});

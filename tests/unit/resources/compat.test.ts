import { describe, it, expect, beforeEach } from 'vitest';
import { AttachmentsResource } from '../../../src/resources/attachments';
import { InterfacesResource } from '../../../src/resources/interfaces';
import { PlatformsResource } from '../../../src/resources/platforms';
import { createMockClient, mockApiResponse, mockPaginatedResponse, type MockClient } from '../../helpers/mock-client';

describe('AttachmentsResource', () => {
  let client: MockClient;
  let attachments: AttachmentsResource;

  beforeEach(() => {
    client = createMockClient();
    attachments = new AttachmentsResource(client);
  });

  it('list forwards filters, including the fit engine ones', async () => {
    client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
    const params = { fits: 'ak-74m', category: 'suppressor', only_offered: true, vendor: 'me' };
    await attachments.list(params);
    expect(client.getPaginated).toHaveBeenCalledWith('/v1/attachments', params);
  });

  it('get URL-encodes the id', async () => {
    client.get.mockResolvedValue(mockApiResponse({}));
    await attachments.get('a/b');
    expect(client.get).toHaveBeenCalledWith('/v1/attachments/a%2Fb');
  });

  it('getFirearms pages', async () => {
    client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
    await attachments.getFirearms('surefire-socom556', { page: 2 });
    expect(client.getPaginated).toHaveBeenCalledWith('/v1/attachments/surefire-socom556/firearms', { page: 2 });
  });

  it('getOffers forwards the region', async () => {
    client.get.mockResolvedValue(mockApiResponse([]));
    await attachments.getOffers('x', { region: 'AU' });
    expect(client.get).toHaveBeenCalledWith('/v1/attachments/x/offers', { region: 'AU' });
  });

  it('listAutoPaging walks every page and stops on the last', async () => {
    client.getPaginated
      .mockResolvedValueOnce(mockPaginatedResponse([{ id: 'a' }, { id: 'b' }], 1, 2))
      .mockResolvedValueOnce(mockPaginatedResponse([{ id: 'c' }], 2, 2));
    const ids: string[] = [];
    for await (const item of attachments.listAutoPaging({ category: 'optic' })) ids.push((item as { id: string }).id);
    expect(ids).toEqual(['a', 'b', 'c']);
    expect(client.getPaginated).toHaveBeenCalledTimes(2);
    expect(client.getPaginated).toHaveBeenLastCalledWith('/v1/attachments', { category: 'optic', page: 2 });
  });

  it('listAutoPaging falls back to page-size heuristics without totalPages', async () => {
    const full = { ...mockPaginatedResponse(Array.from({ length: 20 }, (_, i) => ({ id: String(i) }))), pagination: { page: 1, limit: 20 } };
    client.getPaginated
      .mockResolvedValueOnce(full)
      .mockResolvedValueOnce({ ...mockPaginatedResponse([{ id: 'last' }]), pagination: { page: 2, limit: 20 } });
    let n = 0;
    for await (const _ of attachments.listAutoPaging()) n++;
    expect(n).toBe(21);
  });
});

describe('InterfacesResource', () => {
  let client: MockClient;
  let interfaces: InterfacesResource;

  beforeEach(() => {
    client = createMockClient();
    interfaces = new InterfacesResource(client);
  });

  it('list forwards kind', async () => {
    client.get.mockResolvedValue(mockApiResponse([]));
    await interfaces.list({ kind: 'thread' });
    expect(client.get).toHaveBeenCalledWith('/v1/interfaces', { kind: 'thread' });
  });

  it('getFirearms encodes the colon and slash in a standard id', async () => {
    client.getPaginated.mockResolvedValue(mockPaginatedResponse([]));
    await interfaces.getFirearms('thread:1/2x28');
    expect(client.getPaginated).toHaveBeenCalledWith('/v1/interfaces/thread%3A1%2F2x28/firearms', undefined);
  });
});

describe('PlatformsResource', () => {
  let client: MockClient;
  let platforms: PlatformsResource;

  beforeEach(() => {
    client = createMockClient();
    platforms = new PlatformsResource(client);
  });

  it('list and get hit the platform paths', async () => {
    client.get.mockResolvedValue(mockApiResponse([]));
    await platforms.list();
    expect(client.get).toHaveBeenCalledWith('/v1/platforms');
    await platforms.get('ak-100');
    expect(client.get).toHaveBeenCalledWith('/v1/platforms/ak-100');
  });
});

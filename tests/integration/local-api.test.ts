/**
 * Integration suite against a running API.
 *
 * Skipped unless `GUNSPEC_INTEGRATION_BASE_URL` and `GUNSPEC_INTEGRATION_API_KEY`
 * are set. `pnpm test:integration` points it at the local worker (`pnpm dev:api`)
 * with the dev enterprise key that `db:seed:dev-key` creates; see README.
 * Every assertion is on the *shape* the SDK promises, never on catalog
 * figures, so a reseed cannot fail it.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  GunSpec,
  AuthenticationError,
  NotFoundError,
  BadRequestError,
  PermissionError,
  ConfigurationError,
  GunSpecError,
  FIT_SOURCES,
  SOURCE_KINDS,
} from '../../src';

const BASE_URL = process.env.GUNSPEC_INTEGRATION_BASE_URL;
const API_KEY = process.env.GUNSPEC_INTEGRATION_API_KEY;
const run = BASE_URL && API_KEY ? describe : describe.skip;

run('local API integration', () => {
  const client = new GunSpec({ apiKey: API_KEY, baseURL: BASE_URL, retry: { maxRetries: 0 } });
  const cached = new GunSpec({ apiKey: API_KEY, baseURL: BASE_URL, retry: { maxRetries: 0 }, etagCache: true });
  let firearmId = '';
  let attachmentId = '';

  beforeAll(async () => {
    const { data } = await client.firearms.list({ per_page: 1, sort: 'name' });
    expect(data.length).toBe(1);
    firearmId = data[0]!.id;
    const attachments = await client.attachments.list({ per_page: 1 });
    attachmentId = attachments.data[0]?.id ?? '';
  });

  describe('catalog reads', () => {
    it('list carries pagination in both vocabularies and cache metadata', async () => {
      const res = await client.firearms.list({ per_page: 2 });
      expect(res.pagination.limit).toBe(2);
      expect(res.pagination.per_page).toBe(2);
      expect(res.pagination.total).toBeGreaterThan(0);
      expect(res.etag).toMatch(/^(W\/)?"/);
      expect(res.cacheControl).toContain('max-age');
      expect(res.requestId.length).toBeGreaterThan(0);
      for (const f of res.data) {
        expect(typeof f.updatedAt).toBe('string');
        expect('version' in f).toBe(true);
      }
    });

    it('get returns the record with version, updatedAt and provenance', async () => {
      const { data } = await client.firearms.get(firearmId);
      expect(data.id).toBe(firearmId);
      expect(typeof data.updatedAt).toBe('string');
      expect(Array.isArray(data.provenance?.sources)).toBe(true);
      expect(data.provenance!.sourceKinds.map((s) => s.url)).toEqual(data.provenance!.sources);
      for (const { kind } of data.provenance!.sourceKinds) expect(SOURCE_KINDS).toContain(kind);
      if (data.provenance!.sources.length > 0) expect(SOURCE_KINDS).toContain(data.provenance!.bestSourceKind);
      else expect(data.provenance!.bestSourceKind).toBeNull();
      expect(data.provenance!.version).toBe(data.version);
      expect(data.provenance!.updatedAt).toBe(data.updatedAt);
    });

    it('a caliber carries provenance', async () => {
      const { data: calibers } = await client.calibers.list({ per_page: 1 });
      if (!calibers[0]) return;
      const { data } = await client.calibers.get(calibers[0].id);
      expect(Array.isArray(data.provenance?.sources)).toBe(true);
    });

    it('search, similar, variants and media answer for a known record', async () => {
      const search = await client.firearms.search({ q: firearmId.split('-')[0]!, per_page: 3 });
      expect(Array.isArray(search.data)).toBe(true);
      expect(Array.isArray((await client.firearms.getSimilar(firearmId)).data)).toBe(true);
      expect(Array.isArray((await client.firearms.getVariants(firearmId)).data)).toBe(true);
      const media = await client.firearms.listMedia(firearmId);
      for (const m of media.data) {
        expect(m.url).toMatch(/^https?:\/\//);
        expect(['silhouette', 'render', 'photo', 'schematic', 'model']).toContain(m.kind);
      }
    });

    it('resolve turns a name into an id', async () => {
      const { data: f } = await client.firearms.get(firearmId);
      const { data } = await client.firearms.resolve(f.name);
      expect(['resolved', 'ambiguous', 'unresolved']).toContain(data.status);
      expect(data.query).toBe(f.name);
      const many = await client.firearms.resolveMany([f.name, 'not a real gun 123']);
      expect(many.data.results).toHaveLength(2);
    });

    it('media catalog pages', async () => {
      const res = await client.firearms.mediaCatalog({ per_page: 2 });
      expect(res.pagination.per_page).toBe(2);
      for (const row of res.data) expect(Array.isArray(row.images)).toBe(true);
    });

    it('reference resources answer', async () => {
      expect((await client.manufacturers.list({ per_page: 1 })).data).toHaveLength(1);
      expect((await client.calibers.list({ per_page: 1 })).data).toHaveLength(1);
      expect((await client.categories.list()).data.length).toBeGreaterThan(0);
      expect((await client.stats.summary()).data).toBeTypeOf('object');
    });

    it('bullet.svg is read as text', async () => {
      const ammo = await client.ammunition.list({ per_page: 1 });
      if (ammo.data.length === 0) return;
      const svg = await client.ammunition.getBulletSvg(ammo.data[0]!.id);
      expect(svg.trimStart().startsWith('<')).toBe(true);
      expect(svg).toContain('svg');
    });

    it('a binary endpoint asked for as JSON names the right method', async () => {
      const ammo = await client.ammunition.list({ per_page: 1 });
      if (ammo.data.length === 0) return;
      await expect(client.http.get(`/v1/ammunition/${ammo.data[0]!.id}/bullet.svg`)).rejects.toThrow(/getText\(\)/);
    });

    it('public content needs no key', async () => {
      const anon = new GunSpec({ apiKey: null, baseURL: BASE_URL, retry: { maxRetries: 0 } });
      const notices = await client.content.listNotices();
      expect(Array.isArray(notices.data.notices)).toBe(true);
      const changelog = await anon.content.listChangelog({ per_page: 1 });
      expect(Array.isArray(changelog.data)).toBe(true);
    });
  });

  describe('conditional requests', () => {
    it('second GET is answered from the ETag cache with fromCache=true', async () => {
      const first = await cached.firearms.get(firearmId);
      expect(first.fromCache).toBe(false);
      expect(first.etag).not.toBeNull();
      const second = await cached.firearms.get(firearmId);
      expect(second.status).toBe(304);
      expect(second.fromCache).toBe(true);
      expect(second.data).toEqual(first.data);
    });

    it('requestConditional surfaces a 304 for a tag the caller holds', async () => {
      const fresh = await client.firearms.get(firearmId);
      const res = await client.http.requestConditional({ method: 'GET', path: `/v1/firearms/${firearmId}`, ifNoneMatch: fresh.etag! });
      expect(res.notModified).toBe(true);
      expect(res.status).toBe(304);
    });
  });

  describe('compatibility', () => {
    it('interfaces and platforms list', async () => {
      const standards = await client.interfaces.list();
      expect(standards.data.length).toBeGreaterThan(0);
      expect(standards.data[0]!.id).toMatch(/^[a-z]+:/);
      const platforms = await client.platforms.list();
      expect(Array.isArray(platforms.data)).toBe(true);
      if (platforms.data[0]) {
        const detail = await client.platforms.get(platforms.data[0].id);
        expect(Array.isArray(detail.data.interfaces)).toBe(true);
      }
    });

    it('attachments list, get and fit', async () => {
      if (!attachmentId) return;
      const detail = await client.attachments.get(attachmentId);
      expect(detail.data.id).toBe(attachmentId);
      expect(Array.isArray(detail.data.requires)).toBe(true);
      expect(Array.isArray(detail.data.provenance?.sources)).toBe(true);
      const fits = await client.attachments.getFirearms(attachmentId, { per_page: 2 });
      expect(Array.isArray(fits.data)).toBe(true);
      for (const fit of fits.data) expect(typeof fit.source).toBe('string');
    });

    it('a firearm reports its interfaces and what fits it, with the evidence behind each fit', async () => {
      const interfaces = await client.firearms.getInterfaces(firearmId);
      expect(interfaces.data.firearm.id).toBe(firearmId);
      expect(Array.isArray(interfaces.data.interfaces)).toBe(true);
      const fits = await client.firearms.getAttachments(firearmId, { with_offers: true });
      expect(Array.isArray(fits.data.groups)).toBe(true);
      expect(typeof fits.data.total).toBe('number');
      for (const group of fits.data.groups) {
        for (const item of group.items) {
          expect(typeof item.source).toBe('string');
          expect(FIT_SOURCES).toContain(item.source);
        }
      }
    });

    it('a standard id with a colon and slash round-trips through the path', async () => {
      const standards = await client.interfaces.list({ kind: 'thread' });
      const withSlash = standards.data.find((s) => s.id.includes('/')) ?? standards.data[0];
      if (!withSlash) return;
      const res = await client.interfaces.getFirearms(withSlash.id, { per_page: 1 });
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('seller', () => {
    const sku = `sdk-int-${Date.now()}`;

    it('the dev key acts for the dev shop', async () => {
      const shops = await client.vendor.shops();
      expect(shops.data.length).toBeGreaterThan(0);
      expect(shops.data[0]).toMatchObject({ id: expect.any(String), approved: expect.any(Boolean) });
    });

    it('push, read back, patch, public read, withdraw', async () => {
      const push = await client.vendor.pushOffers({
        offers: [{ sku, firearm_id: firearmId, price_cents: 129900, currency: 'AUD', url: 'https://dev-shop.example/x', in_stock: true }],
      });
      expect(push.data.written).toBe(1);
      expect(push.data.unmatched).toEqual([]);

      const mine = await client.vendor.listOffers({ q: sku });
      const row = mine.data.find((o) => o.sku === sku);
      expect(row).toMatchObject({ targetKind: 'firearm', targetId: firearmId, priceCents: 129900 });

      const patched = await client.vendor.updateOffer(sku, { price_cents: 119900, status: 'published' });
      expect(patched.data.sku).toBe(sku);

      const offers = await client.firearms.getOffers(firearmId);
      const mineOffer = offers.data.find((o) => o.sku === sku);
      expect(mineOffer?.priceCents).toBe(119900);
      if (mineOffer?.clickId) {
        expect(client.vendor.clickUrl(mineOffer.clickId)).toBe(`${BASE_URL}/v1/out/${mineOffer.clickId}`);
        const target = await client.vendor.resolveClick(mineOffer.clickId);
        expect(target).toBe('https://dev-shop.example/x');
      }

      const removed = await client.vendor.deleteOffer(sku);
      expect(removed.data.removed).toBe(true);
    });

    it('unmatched ids are reported, not refused; a float price is refused', async () => {
      const push = await client.vendor.pushOffers({
        offers: [{ sku: `${sku}-x`, firearm_id: 'no-such-firearm-xyz', price_cents: 100, currency: 'AUD', url: 'https://dev-shop.example/y' }],
      });
      expect(push.data.written).toBe(0);
      expect(push.data.unmatched[0]).toMatchObject({ targetId: 'no-such-firearm-xyz' });

      await expect(client.vendor.pushOffers({
        offers: [{ sku: `${sku}-f`, firearm_id: firearmId, price_cents: 10.5, currency: 'AUD', url: 'https://dev-shop.example/z' }],
      })).rejects.toBeInstanceOf(BadRequestError);
    });
  });

  describe('account', () => {
    it('favorites add and remove, and ids reflect it', async () => {
      const had = (await client.favorites.listIds()).data.ids.includes(firearmId);
      const added = await client.favorites.add(firearmId);
      expect(added.data).toEqual({ firearmId, favorited: true });
      expect((await client.favorites.listIds()).data.ids).toContain(firearmId);
      const removed = await client.favorites.remove(firearmId);
      expect(removed.data).toEqual({ firearmId, favorited: false });
      expect((await client.favorites.listIds()).data.ids).not.toContain(firearmId);
      if (had) await client.favorites.add(firearmId);
    });

    it('usage answers for the key', async () => {
      expect((await client.usage.get()).data).toBeTypeOf('object');
    });

    it('webhook endpoints create, test, delete', async () => {
      const created = await client.webhooks.create({ url: 'https://example.com/gunspec-sdk-int', events: ['firearm.updated'] });
      const id = created.data.id;
      try {
        const listed = await client.webhooks.list();
        expect(listed.data.some((e) => e.id === id)).toBe(true);
        expect((await client.webhooks.test(id)).data).toBeTypeOf('object');
      } finally {
        await client.webhooks.delete(id);
      }
    });
  });

  describe('errors carry a reason', () => {
    it('no key is AUTH_REQUIRED / KEY_MISSING', async () => {
      const anon = new GunSpec({ apiKey: null, baseURL: BASE_URL, retry: { maxRetries: 0 } });
      const err = await anon.firearms.get(firearmId).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(AuthenticationError);
      expect(['AUTH_REQUIRED', 'KEY_MISSING']).toContain((err as AuthenticationError).reason);
      expect((err as AuthenticationError).action.length).toBeGreaterThan(0);
    });

    it('a wrong key is KEY_INVALID', async () => {
      const wrongKey = `${API_KEY}-wrong`;
      const bad = new GunSpec({ apiKey: wrongKey, baseURL: BASE_URL, retry: { maxRetries: 0 } });
      const err = await bad.firearms.get(firearmId).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(AuthenticationError);
      expect((err as AuthenticationError).reason).toBe('KEY_INVALID');
    });

    it('an unknown id is RESOURCE_NOT_FOUND', async () => {
      const err = await client.firearms.get('no-such-firearm-xyz').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(NotFoundError);
      expect((err as NotFoundError).reason).toBe('RESOURCE_NOT_FOUND');
      expect((err as NotFoundError).requestId.length).toBeGreaterThan(0);
    });

    it('a bad parameter is INVALID_PARAMETER with details', async () => {
      const err = await client.firearms.list({ per_page: 100000 }).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(BadRequestError);
      expect(['INVALID_PARAMETER', 'INVALID_REQUEST']).toContain((err as BadRequestError).reason);
    });

    it('a seller write on a SKU the shop does not hold is a typed refusal', async () => {
      const err = await client.vendor.updateOffer('no-such-sku-xyz', { price_cents: 1 }).catch((e: unknown) => e);
      expect(err instanceof NotFoundError || err instanceof PermissionError).toBe(true);
      expect(typeof (err as GunSpecError & { reason: string }).reason).toBe('string');
    });
  });

  describe('auth schemes and transport', () => {
    it('Bearer is accepted', async () => {
      const bearer = new GunSpec({ apiKey: API_KEY, baseURL: BASE_URL, authScheme: 'bearer', retry: { maxRetries: 0 } });
      const { data } = await bearer.firearms.get(firearmId);
      expect(data.id).toBe(firearmId);
    });

    it('a key over plain http to localhost is allowed, to a remote host refused', () => {
      expect(() => new GunSpec({ apiKey: API_KEY, baseURL: BASE_URL })).not.toThrow();
      expect(() => new GunSpec({ apiKey: API_KEY, baseURL: 'http://api.example.com' })).toThrow(ConfigurationError);
    });
  });
});

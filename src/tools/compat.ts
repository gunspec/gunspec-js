/**
 * Compatibility and seller tools: attachments, what fits what, mount
 * standards, platforms, and where to buy.
 *
 * @module
 */

import type { GunSpec } from '../client';
import { defineTool, PAGE, PER_PAGE, SLUG } from './types';
import { ATTACHMENT_STATUSES } from '../types/vocabulary';

export const listAttachments = defineTool<{
  category?: string; manufacturer?: string; fits?: string; requires?: string; q?: string;
  factory?: boolean; status?: 'in_production' | 'discontinued' | 'limited';
  page?: number; per_page?: number;
}>({
  name: 'gunspec_list_attachments',
  title: 'List attachments',
  description:
    'Lists suppressors, optics, magazines, grips, stocks and other attachments. `fits` limits results to attachments that fit one firearm and requires the Studio plan. `requires` limits results to parts that need one mount standard.',
  tier: 'explorer',
  example: { per_page: 5 },
  prompts: ['List some attachments in the catalog.'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Attachment category, e.g. "suppressor", "optic", "magazine", "grip" or "stock".' },
      manufacturer: { type: 'string', description: 'Manufacturer slug.' },
      fits: { type: 'string', description: 'Return only attachments that fit this firearm slug. Requires the Studio plan.' },
      requires: { type: 'string', description: 'Return only attachments that require this interface standard id, e.g. "thread:1/2x28".' },
      q: { type: 'string', description: 'Text to match within the attachment name.' },
      factory: { type: 'boolean', description: 'Set to true for factory parts only, or false for aftermarket parts only.' },
      status: { type: 'string', description: 'Production status.', enum: ATTACHMENT_STATUSES },
      page: PAGE,
      per_page: PER_PAGE,
    },
    additionalProperties: false,
  },
  execute: async (client, args) => {
    const res = await client.attachments.list(args);
    return { attachments: res.data, pagination: res.pagination };
  },
});

export const getAttachment = defineTool<{ id: string }>({
  name: 'gunspec_get_attachment',
  title: 'Get an attachment',
  description: 'Returns the full record for one attachment: its requirements (any-of within a group, all-of across groups), what it provides once fitted, caliber ratings, weight, length and sources.',
  tier: 'explorer',
  example: { id: 'surefire-socom556-rc2' },
  prompts: ['Tell me about the SureFire SOCOM556-RC2 suppressor.'],
  readOnly: true,
  inputSchema: { type: 'object', properties: { id: SLUG('attachment') }, required: ['id'], additionalProperties: false },
  execute: async (client, { id }) => (await client.attachments.get(id)).data,
});

export const firearmAttachments = defineTool<{
  id: string; category?: string; include?: 'compatible' | 'all'; min_confidence?: number;
}>({
  name: 'gunspec_firearm_attachments',
  title: 'What fits a firearm',
  description:
    'Returns the attachments that fit one firearm, grouped by category. Each result states how the fit was determined (direct, via adapter or curated) and its confidence. Fit is computed from mount interfaces, never from names. Requires the Studio plan.',
  tier: 'studio',
  example: { id: 'glock-g17' },
  prompts: ['Which attachments fit a Glock 17?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      id: SLUG('firearm'),
      category: { type: 'string', description: 'Return this attachment category only.' },
      include: { type: 'string', description: 'Set to "all" to also return candidates that do not fit, each with `blockedBy`.', enum: ['compatible', 'all'] },
      min_confidence: { type: 'number', description: 'Hides fits computed through interfaces below this confidence (0 to 1).', minimum: 0, maximum: 1 },
    },
    required: ['id'],
    additionalProperties: false,
  },
  execute: async (client, { id, ...params }) => (await client.firearms.getAttachments(id, params)).data,
});

export const firearmInterfaces = defineTool<{ id: string }>({
  name: 'gunspec_firearm_interfaces',
  title: "A firearm's mount interfaces",
  description: 'Returns the mount standards a firearm exposes at each position (muzzle thread, rail, magazine well, stock), with the source and confidence of each row. Requires the Studio plan.',
  tier: 'studio',
  example: { id: 'glock-g17' },
  prompts: ['What mounting interfaces does the Glock 17 have?'],
  readOnly: true,
  inputSchema: { type: 'object', properties: { id: SLUG('firearm') }, required: ['id'], additionalProperties: false },
  execute: async (client, { id }) => (await client.firearms.getInterfaces(id)).data,
});

export const attachmentFirearms = defineTool<{ id: string; page?: number; per_page?: number }>({
  name: 'gunspec_attachment_firearms',
  title: 'What an attachment fits',
  description: 'Returns every firearm that one attachment fits, with the supporting evidence for each. Requires the Studio plan.',
  tier: 'studio',
  example: { id: 'surefire-socom556-rc2', per_page: 5 },
  prompts: ['Which firearms does the SureFire SOCOM556-RC2 fit?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: { id: SLUG('attachment'), page: PAGE, per_page: PER_PAGE },
    required: ['id'],
    additionalProperties: false,
  },
  execute: async (client, { id, ...params }) => {
    const res = await client.attachments.getFirearms(id, params);
    return { firearms: res.data, pagination: res.pagination };
  },
});

export const listInterfaces = defineTool<{ kind?: string }>({
  name: 'gunspec_list_interfaces',
  title: 'List mount standards',
  description: 'Lists the mount interface standards the fit engine uses: threads, rails, magazine wells, stock interfaces and optic footprints. Each id is prefixed with its kind, e.g. "thread:1/2x28".',
  tier: 'explorer',
  example: {},
  prompts: ['Which mount standards does the catalog track?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: { kind: { type: 'string', description: 'Return this interface kind only, e.g. "thread", "rail", "mag", "optic" or "stock".' } },
    additionalProperties: false,
  },
  execute: async (client, args) => (await client.interfaces.list(args)).data,
});

export const listPlatforms = defineTool<Record<string, never>>({
  name: 'gunspec_list_platforms',
  title: 'List platforms',
  description: 'Lists firearm families (AK-100, AR-15, Glock) with their member counts. Every member of a family inherits its mount interfaces. Requires the Studio plan.',
  tier: 'studio',
  example: {},
  prompts: ['Which firearm platforms share parts?'],
  readOnly: true,
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  execute: async (client) => (await client.platforms.list()).data,
});

export const getPlatform = defineTool<{ id: string }>({
  name: 'gunspec_get_platform',
  title: 'Get a platform',
  description: "Returns one platform's interface rows and its member firearms. Requires the Studio plan.",
  tier: 'studio',
  example: { id: 'ak-100' },
  prompts: ['What is the AK-100 platform, and which firearms belong to it?'],
  readOnly: true,
  inputSchema: { type: 'object', properties: { id: SLUG('platform') }, required: ['id'], additionalProperties: false },
  execute: async (client, { id }) => (await client.platforms.get(id)).data,
});

export const firearmOffers = defineTool<{ id: string; region?: string }>({
  name: 'gunspec_firearm_offers',
  title: 'Where to buy a firearm',
  description:
    'Lists sellers currently offering a firearm, with the price in integer minor units plus currency, a stock flag and an outbound link. Format prices for their currency, and never divide the amount before formatting. Each listing is a paid placement.',
  tier: 'explorer',
  example: { id: 'glock-g17' },
  prompts: ['Where can I buy a Glock 17?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      id: SLUG('firearm'),
      region: { type: 'string', description: 'ISO 3166-1 alpha-2 country code. Hides sellers who do not ship to that country. This filter is a convenience, not a legal check.' },
    },
    required: ['id'],
    additionalProperties: false,
  },
  execute: async (client, { id, region }) => withClickUrls(client, (await client.firearms.getOffers(id, { region })).data),
});

export const attachmentOffers = defineTool<{ id: string; region?: string }>({
  name: 'gunspec_attachment_offers',
  title: 'Where to buy an attachment',
  description: 'Lists sellers currently offering an attachment, with price, stock and an outbound link. The same rules apply as for gunspec_firearm_offers.',
  tier: 'explorer',
  example: { id: 'surefire-socom556-rc2' },
  prompts: ['Where can I buy a SureFire SOCOM556-RC2?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      id: SLUG('attachment'),
      region: { type: 'string', description: 'ISO 3166-1 alpha-2 country code. Hides sellers who do not ship to that country.' },
    },
    required: ['id'],
    additionalProperties: false,
  },
  execute: async (client, { id, region }) => withClickUrls(client, (await client.attachments.getOffers(id, { region })).data),
});

/** Attach the tracked outbound link to each offer so a host links through it. */
function withClickUrls<T extends { clickId: string | null }>(client: GunSpec, offers: T[]) {
  return offers.map((o) => ({ ...o, href: o.clickId ? client.vendor.clickUrl(o.clickId) : null }));
}

export const COMPAT_TOOLS = [
  listAttachments, getAttachment, firearmAttachments, firearmInterfaces, attachmentFirearms,
  listInterfaces, listPlatforms, getPlatform, firearmOffers, attachmentOffers,
] as const;

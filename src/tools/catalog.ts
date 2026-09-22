/**
 * Firearm tools: find, identify, read, compare.
 *
 * @module
 */

import { defineTool, PAGE, PER_PAGE, SLUG } from './types';
import { FIREARM_STATUSES, MEDIA_KINDS } from '../types/vocabulary';

export const searchFirearms = defineTool<{ q: string; per_page?: number }>({
  name: 'gunspec_search_firearms',
  title: 'Search firearms',
  description:
    'Runs a full-text search over the firearm catalog by name, manufacturer, model number or alias. Use this tool first when the user refers to a firearm informally. Returns matching firearms with the slug ids that the other tools accept. Needs the Builder plan; on Explorer, find records with gunspec_list_firearms filters (maker, cartridge, category, year) instead.',
  tier: 'builder',
  example: { q: 'steyr f88', per_page: 3 },
  prompts: ['Find firearms matching "steyr f88".'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      q: { type: 'string', description: 'The search text, e.g. "beretta 92" or "AK-74M".' },
      per_page: PER_PAGE,
    },
    required: ['q'],
    additionalProperties: false,
  },
  execute: async (client, { q, per_page }) => {
    const res = await client.firearms.search({ q, per_page });
    return { results: res.data, pagination: res.pagination };
  },
});

export const resolveFirearm = defineTool<{ name: string }>({
  name: 'gunspec_resolve_firearm',
  title: 'Resolve a firearm name',
  description:
    'Resolves one free-text name ("G19 gen 5", "M4A1") to a single firearm id, with a confidence score and alternatives. Use this tool instead of search when exactly one record is required. Needs the Builder plan.',
  tier: 'builder',
  example: { name: 'G19 gen 5' },
  prompts: ['Which firearm is a "G19 gen 5"?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string', description: 'The firearm name exactly as the user wrote it.' } },
    required: ['name'],
    additionalProperties: false,
  },
  execute: async (client, { name }) => (await client.firearms.resolve(name)).data,
});

export const listFirearms = defineTool<{
  manufacturer?: string; caliber?: string; category?: string; action_type?: string;
  country_of_origin?: string; status?: 'in_production' | 'discontinued' | 'prototype';
  year_introduced_min?: number; year_introduced_max?: number;
  sort?: 'name' | 'weight' | 'year' | 'caliber' | 'created_at' | 'favorites'; order?: 'asc' | 'desc';
  page?: number; per_page?: number;
}>({
  name: 'gunspec_list_firearms',
  title: 'List firearms',
  description:
    'Lists firearms using structured filters: manufacturer, cartridge, category, action, country, status and year range. Use this tool when the question asks which firearms match a set of criteria, not when it asks about one specific firearm.',
  tier: 'explorer',
  example: { caliber: '5-45x39mm', per_page: 5 },
  prompts: ['List five firearms chambered in 5.45x39mm.'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      manufacturer: { type: 'string', description: 'Manufacturer slug, e.g. "glock".' },
      caliber: { type: 'string', description: 'Caliber slug, e.g. "9x19mm-parabellum".' },
      category: { type: 'string', description: 'Category slug, e.g. "pistol", "rifle" or "shotgun".' },
      action_type: { type: 'string', description: 'Action type, e.g. "semi-automatic" or "bolt-action".' },
      country_of_origin: { type: 'string', description: 'Country name or ISO code.' },
      status: { type: 'string', description: 'Production status.', enum: FIREARM_STATUSES },
      year_introduced_min: { type: 'integer', description: 'Earliest year introduced.' },
      year_introduced_max: { type: 'integer', description: 'Latest year introduced.' },
      sort: { type: 'string', description: 'Sort column.', enum: ['name', 'weight', 'year', 'caliber', 'created_at', 'favorites'] },
      order: { type: 'string', description: 'Sort direction.', enum: ['asc', 'desc'] },
      page: PAGE,
      per_page: PER_PAGE,
    },
    additionalProperties: false,
  },
  execute: async (client, args) => {
    const res = await client.firearms.list(args);
    return { firearms: res.data, pagination: res.pagination };
  },
});

export const getFirearm = defineTool<{ id: string }>({
  name: 'gunspec_get_firearm',
  title: 'Get a firearm',
  description:
    'Returns the full specification of one firearm: dimensions, weight, calibers, action, capacity, years, designer, description, provenance and record version. Requires a slug from the search, resolve or list tools.',
  tier: 'builder',
  example: { id: 'ak-47' },
  prompts: ['What are the specifications of the AK-47?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: { id: SLUG('firearm') },
    required: ['id'],
    additionalProperties: false,
  },
  execute: async (client, { id }) => (await client.firearms.get(id)).data,
});

export const compareFirearms = defineTool<{ ids: string[] }>({
  name: 'gunspec_compare_firearms',
  title: 'Compare firearms',
  description: 'Returns side-by-side specifications for two to five firearms, with the differences calculated.',
  tier: 'builder',
  example: { ids: ['ak-47', 'm4a1-carbine'] },
  prompts: ['Compare the AK-47 with the M4A1 carbine side by side.'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      ids: { type: 'array', description: 'Two to five firearm slugs.', items: { type: 'string' } },
    },
    required: ['ids'],
    additionalProperties: false,
  },
  execute: async (client, { ids }) => (await client.firearms.compare({ ids: ids.join(',') })).data,
});

export const similarFirearms = defineTool<{ id: string }>({
  name: 'gunspec_similar_firearms',
  title: 'Similar firearms',
  description: 'Returns firearms similar to this one in role, cartridge, size and era. Use this tool for questions such as "what else is like the X".',
  tier: 'explorer',
  example: { id: 'glock-g17' },
  prompts: ['Which firearms are similar to the Glock 17?'],
  readOnly: true,
  inputSchema: { type: 'object', properties: { id: SLUG('firearm') }, required: ['id'], additionalProperties: false },
  execute: async (client, { id }) => (await client.firearms.getSimilar(id)).data,
});

export const firearmVariants = defineTool<{ id: string }>({
  name: 'gunspec_firearm_variants',
  title: 'Firearm variants',
  description: 'Returns the variants and derivatives of a firearm, for example the Gen 3, Gen 4, Gen 5, MOS and compact forms of a Glock 19.',
  tier: 'explorer',
  example: { id: 'ak-47' },
  prompts: ['What variants of the AK-47 are there?'],
  readOnly: true,
  inputSchema: { type: 'object', properties: { id: SLUG('firearm') }, required: ['id'], additionalProperties: false },
  execute: async (client, { id }) => (await client.firearms.getVariants(id)).data,
});

export const firearmMedia = defineTool<{ id: string; kind?: 'silhouette' | 'render' | 'photo' | 'schematic' | 'model' }>({
  name: 'gunspec_firearm_media',
  title: 'Firearm media',
  description: 'Returns every image, silhouette, render, schematic and 3D model URL for a firearm, with credits and sizes. Use the URLs directly. Do not attempt to fetch file contents through this tool.',
  tier: 'explorer',
  example: { id: 'accuracy-international-awm' },
  prompts: ['Show me images and the 3D model of the Accuracy International AWM.'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      id: SLUG('firearm'),
      kind: { type: 'string', description: 'Return this media kind only.', enum: MEDIA_KINDS },
    },
    required: ['id'],
    additionalProperties: false,
  },
  execute: async (client, { id, kind }) => (await client.firearms.listMedia(id, kind ? { kind } : undefined)).data,
});

export const topFirearms = defineTool<{
  stat: 'lightest' | 'heaviest' | 'longest-range' | 'highest-rof' | 'most-compact' | 'highest-capacity' | 'most-powerful';
  category?: string; limit?: number;
}>({
  name: 'gunspec_top_firearms',
  title: 'Top firearms by a statistic',
  description: 'Ranks the catalog by one measurable statistic: lightest, heaviest, longest range, highest rate of fire, most compact, highest capacity or most powerful. Results can be limited to one category.',
  tier: 'builder',
  example: { stat: 'lightest', category: 'pistol', limit: 5 },
  prompts: ['What are the five lightest pistols in the catalog?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      stat: { type: 'string', description: 'The statistic to rank by.', enum: ['lightest', 'heaviest', 'longest-range', 'highest-rof', 'most-compact', 'highest-capacity', 'most-powerful'] },
      category: { type: 'string', description: 'Limit results to this category slug.' },
      limit: { type: 'integer', description: 'Number of results to return.', minimum: 1, maximum: 50, default: 10 },
    },
    required: ['stat'],
    additionalProperties: false,
  },
  execute: async (client, args) => (await client.firearms.top(args)).data,
});

export const CATALOG_TOOLS = [
  searchFirearms, resolveFirearm, listFirearms, getFirearm, compareFirearms,
  similarFirearms, firearmVariants, firearmMedia, topFirearms,
] as const;

/**
 * Firearm tools: find, identify, read, compare, cost to carry, recoil, point-blank range and ammunition per kilogram.
 *
 * @module
 */

import { defineTool, PAGE, PER_PAGE, SLUG } from './types';
import { FIREARM_STATUSES, MEDIA_KINDS } from '../types/vocabulary';
import type { LoadCarriageModel, LoadCarriageTerrain, RecoilGasClass } from '../types';

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

export const loadCarriage = defineTool<{
  ids: string[]; body_mass_kg?: number; body_fat_pct?: number; kit_kg?: number; magazines?: number;
  attachments?: string[]; speed_kmh?: number; grade_pct?: number; terrain?: LoadCarriageTerrain;
  distance_km?: number; model?: LoadCarriageModel;
}>({
  name: 'gunspec_load_carriage',
  title: 'Load carriage cost',
  description:
    'Returns the metabolic energy a foot march costs carrying each of one to five firearms, with its magazines and attachments, on top of the other kit carried, by the US Army LCDA equation (Looney et al. 2022) or the Pandolf equation (1977). Use this tool when the question is how much harder one firearm is to carry than another over a distance. Masses come from the catalog; a firearm missing its empty or loaded weight comes back with an error instead of a cost. The answer is energy cost only: it does not predict fatigue, marksmanship or time to exhaustion.',
  tier: 'builder',
  example: { ids: ['hk416', 'fn-scar-l'], magazines: 7, kit_kg: 25, distance_km: 20 },
  prompts: ['How much more energy does a 20 km march cost carrying an FN SCAR-L than an HK416, with seven magazines and 25 kg of kit?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      ids: { type: 'array', description: 'One to five firearm slugs.', items: { type: 'string' } },
      body_mass_kg: { type: 'number', description: 'Body mass of the person marching, in kg.', minimum: 40, maximum: 160, default: 80 },
      body_fat_pct: { type: 'number', description: 'Body fat as a percentage of body mass.', minimum: 3, maximum: 50, default: 15 },
      kit_kg: { type: 'number', description: 'Everything else carried, in kg: armour, pack, water.', minimum: 0, maximum: 120, default: 0 },
      magazines: { type: 'integer', description: 'Full magazines carried in total, the one in the firearm included. 0 carries it unloaded.', minimum: 0, maximum: 20, default: 1 },
      attachments: { type: 'array', description: 'Up to ten attachment slugs, added to every firearm by their recorded weight.', items: { type: 'string' } },
      speed_kmh: { type: 'number', description: 'Marching speed in km/h.', minimum: 1, maximum: 10, default: 4.8 },
      grade_pct: { type: 'number', description: 'Slope as a percentage, rise over run; negative is downhill.', minimum: -30, maximum: 30, default: 0 },
      terrain: { type: 'string', description: 'The surface marched over.', enum: ['paved', 'dirt_road', 'light_brush', 'heavy_brush', 'swampy_bog', 'loose_sand'], default: 'paved' },
      distance_km: { type: 'number', description: 'March distance in km.', minimum: 0.1, maximum: 200, default: 20 },
      model: { type: 'string', description: 'The equation: lcda, or pandolf for comparison with older studies (level and uphill only).', enum: ['lcda', 'pandolf'], default: 'lcda' },
    },
    required: ['ids'],
    additionalProperties: false,
  },
  execute: async (client, { ids, attachments, ...march }) =>
    (await client.firearms.loadCarriage({ ...march, ids: ids.join(','), attachments: attachments?.join(',') })).data,
});

export const firearmRecoil = defineTool<{
  ids: string[]; ammo_id?: string; mass?: 'loaded' | 'empty'; powder_charge_g?: number; gas_class?: RecoilGasClass;
}>({
  name: 'gunspec_firearm_recoil',
  title: 'Free recoil',
  description:
    'Returns the free recoil of one to five firearms firing a load: the velocity each is pushed back at, the energy it takes and the impulse, by the free recoil formula SAAMI publishes, from the firearm\'s recorded mass and the muzzle velocity its own barrel gives the load. Use this tool when the question is how hard one firearm kicks against another. The catalog holds no powder charge, so without powder_charge_g only the bullet is counted and every figure is a lower bound; say so when you quote it. It is free recoil, not felt recoil, and does not count a muzzle brake.',
  tier: 'builder',
  example: { ids: ['hk416', 'm4-carbine'], ammo_id: 'm855' },
  prompts: ['How much free recoil does an HK416 have against an M4 carbine firing M855?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      ids: { type: 'array', description: 'One to five firearm slugs.', items: { type: 'string' } },
      ammo_id: { type: 'string', description: 'The load every firearm fires. Leave it out to fire each with the load its ballistic profile uses.' },
      mass: { type: 'string', description: 'Which recorded weight recoils.', enum: ['loaded', 'empty'], default: 'loaded' },
      powder_charge_g: { type: 'number', description: 'The load\'s powder charge in grams, when the user states one. Needs ammo_id.', minimum: 0, maximum: 100 },
      gas_class: { type: 'string', description: 'The SAAMI class whose gas velocity factor applies, in place of the one read from the category.', enum: ['rifle', 'shotgun', 'shotgun_long_barrel', 'handgun'] },
    },
    required: ['ids'],
    additionalProperties: false,
  },
  execute: async (client, { ids, ...shot }) => (await client.firearms.recoil({ ...shot, ids: ids.join(',') })).data,
});

export const pointBlankRange = defineTool<{ ids: string[]; ammo_id?: string; target_mm?: number; sight_height_mm?: number }>({
  name: 'gunspec_point_blank_range',
  title: 'Point-blank and supersonic range',
  description:
    'Returns the maximum point-blank range of one to five firearms, the furthest distance the bullet stays within half a target\'s diameter of the line of sight with no holdover, with the zero that gives it, and how far the bullet stays supersonic. Computed on the same trajectory as the ballistic profile, from each firearm\'s own barrel, in the ICAO standard atmosphere. Use this tool for questions about point-blank range, what distance to zero at, or when a bullet goes subsonic.',
  tier: 'builder',
  example: { ids: ['hk416', 'fn-scar-h'], target_mm: 200 },
  prompts: ['What is the maximum point-blank range of an HK416 against an FN SCAR-H on a 200 mm target?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      ids: { type: 'array', description: 'One to five firearm slugs.', items: { type: 'string' } },
      ammo_id: { type: 'string', description: 'The load every firearm fires. Leave it out to fire each with the load its ballistic profile uses.' },
      target_mm: { type: 'number', description: 'Target diameter in mm.', minimum: 20, maximum: 2000, default: 200 },
      sight_height_mm: { type: 'number', description: 'Sight height above the bore in mm. Leave it out for the height assumed for the category.', minimum: 0, maximum: 150 },
    },
    required: ['ids'],
    additionalProperties: false,
  },
  execute: async (client, { ids, ...target }) => (await client.firearms.pointBlank({ ...target, ids: ids.join(',') })).data,
});

export const ammoLoad = defineTool<{ ids: string[]; ammo_id?: string; budget_kg?: number; magazines?: number; rounds?: number }>({
  name: 'gunspec_ammo_load',
  title: 'Ammunition per kilogram',
  description:
    'Returns how much ammunition one to five firearms carry per kilogram: rounds per kilogram of full magazines and how many full magazines fit a weight budget, derived from each firearm\'s loaded and empty weights, and the estimated mass of a basic load of rounds and magazines from a fitted cartridge-mass model. Derived and estimated figures are labelled; always say which a figure is, and give an estimate with its range. A warning beside a magazine means the catalog\'s weights for it look wrong.',
  tier: 'builder',
  example: { ids: ['hk416', 'ak-74'], budget_kg: 5 },
  prompts: ['How many rounds can I carry in 5 kg of magazines for an HK416 against an AK-74?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      ids: { type: 'array', description: 'One to five firearm slugs.', items: { type: 'string' } },
      ammo_id: { type: 'string', description: 'A load whose bullet the estimate uses. Leave it out for each cartridge\'s typical bullet.' },
      budget_kg: { type: 'number', description: 'A weight of full magazines to fill, in kg.', minimum: 0.1, maximum: 100, default: 5 },
      magazines: { type: 'integer', description: 'Full magazines in the estimated basic load.', minimum: 0, maximum: 50, default: 7 },
      rounds: { type: 'integer', description: 'Rounds in the estimated basic load. Leave it out for magazines times the capacity.', minimum: 1, maximum: 10000 },
    },
    required: ['ids'],
    additionalProperties: false,
  },
  execute: async (client, { ids, ...load }) => (await client.firearms.ammoLoad({ ...load, ids: ids.join(',') })).data,
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
  loadCarriage, firearmRecoil, pointBlankRange, ammoLoad, similarFirearms, firearmVariants, firearmMedia, topFirearms,
] as const;

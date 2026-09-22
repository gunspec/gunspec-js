/**
 * Reference tools: manufacturers, calibers, categories, ammunition,
 * statistics and the changelog.
 *
 * @module
 */

import { defineTool, PAGE, PER_PAGE, SLUG } from './types';
import { CHANGELOG_CATEGORIES } from '../types/vocabulary';

export const listManufacturers = defineTool<{ country?: string; page?: number; per_page?: number }>({
  name: 'gunspec_list_manufacturers',
  title: 'List manufacturers',
  description: 'Lists manufacturers in the catalog with their slugs, optionally filtered by country.',
  tier: 'explorer',
  example: { per_page: 5 },
  prompts: ['List some firearm manufacturers.'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      country: { type: 'string', description: 'Country name or ISO code.' },
      page: PAGE,
      per_page: PER_PAGE,
    },
    additionalProperties: false,
  },
  execute: async (client, args) => {
    const res = await client.manufacturers.list(args);
    return { manufacturers: res.data, pagination: res.pagination };
  },
});

export const getManufacturer = defineTool<{ id: string }>({
  name: 'gunspec_get_manufacturer',
  title: 'Get a manufacturer',
  description: 'Returns one manufacturer, including founding details, country, headquarters, description and website.',
  tier: 'explorer',
  example: { id: 'glock' },
  prompts: ['Tell me about Glock as a manufacturer.'],
  readOnly: true,
  inputSchema: { type: 'object', properties: { id: SLUG('manufacturer') }, required: ['id'], additionalProperties: false },
  execute: async (client, { id }) => (await client.manufacturers.get(id)).data,
});

export const manufacturerFirearms = defineTool<{ id: string; page?: number; per_page?: number }>({
  name: 'gunspec_manufacturer_firearms',
  title: "A manufacturer's firearms",
  description: 'Returns every firearm a manufacturer makes or has made, with pagination.',
  tier: 'explorer',
  example: { id: 'kalashnikov-concern', per_page: 5 },
  prompts: ['Which firearms does Kalashnikov Concern make?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: { id: SLUG('manufacturer'), page: PAGE, per_page: PER_PAGE },
    required: ['id'],
    additionalProperties: false,
  },
  execute: async (client, { id, ...params }) => {
    const res = await client.manufacturers.getFirearms(id, params);
    return { firearms: res.data, pagination: res.pagination };
  },
});

export const listCalibers = defineTool<{ cartridge_type?: string; page?: number; per_page?: number }>({
  name: 'gunspec_list_calibers',
  title: 'List calibers',
  description: 'Lists cartridges in the catalog with bullet diameter, case length and type. Use this tool to find a caliber slug.',
  tier: 'explorer',
  example: { per_page: 5 },
  prompts: ['List some calibers in the catalog.'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      cartridge_type: { type: 'string', description: 'Cartridge type, e.g. "rimfire", "centerfire" or "shotshell".' },
      page: PAGE,
      per_page: PER_PAGE,
    },
    additionalProperties: false,
  },
  execute: async (client, args) => {
    const res = await client.calibers.list(args);
    return { calibers: res.data, pagination: res.pagination };
  },
});

export const getCaliber = defineTool<{ id: string }>({
  name: 'gunspec_get_caliber',
  title: 'Get a caliber',
  description: 'Returns the full record for one cartridge: SAAMI/CIP dimensions, case shape, projectile, origin, parent cartridge and provenance.',
  tier: 'explorer',
  example: { id: '9x19mm-parabellum' },
  prompts: ['What are the dimensions of the 9x19mm Parabellum cartridge?'],
  readOnly: true,
  inputSchema: { type: 'object', properties: { id: SLUG('caliber') }, required: ['id'], additionalProperties: false },
  execute: async (client, { id }) => (await client.calibers.get(id)).data,
});

export const caliberFirearms = defineTool<{ id: string; page?: number; per_page?: number }>({
  name: 'gunspec_caliber_firearms',
  title: 'Firearms chambered in a caliber',
  description: 'Returns every firearm chambered for a cartridge, with pagination.',
  tier: 'explorer',
  example: { id: '9x19mm-parabellum', per_page: 5 },
  prompts: ['Which firearms are chambered in 9mm Parabellum?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: { id: SLUG('caliber'), page: PAGE, per_page: PER_PAGE },
    required: ['id'],
    additionalProperties: false,
  },
  execute: async (client, { id, ...params }) => {
    const res = await client.calibers.getFirearms(id, params);
    return { firearms: res.data, pagination: res.pagination };
  },
});

export const listCategories = defineTool<Record<string, never>>({
  name: 'gunspec_list_categories',
  title: 'List categories',
  description: 'Lists the firearm categories, such as pistol, revolver, rifle, shotgun and submachine gun, with their slugs and counts.',
  tier: 'explorer',
  example: {},
  prompts: ['What categories of firearm does the catalog cover?'],
  readOnly: true,
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  execute: async (client) => (await client.categories.list()).data,
});

export const listAmmunition = defineTool<{ caliber_id?: string; bullet_type?: string; page?: number; per_page?: number }>({
  name: 'gunspec_list_ammunition',
  title: 'List ammunition loads',
  description: 'Lists factory loads with bullet weight, bullet type, ballistic coefficient and reference velocity. Results can be filtered by caliber.',
  tier: 'builder',
  example: { caliber_id: '9x19mm-parabellum', per_page: 5 },
  prompts: ['List some 9mm Parabellum ammunition loads.'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      caliber_id: { type: 'string', description: 'Caliber slug.' },
      bullet_type: { type: 'string', description: 'Bullet type, e.g. "fmj", "hollow-point" or "soft-point".' },
      page: PAGE,
      per_page: PER_PAGE,
    },
    additionalProperties: false,
  },
  execute: async (client, args) => {
    const res = await client.ammunition.list(args);
    return { ammunition: res.data, pagination: res.pagination };
  },
});

export const ammunitionBallistics = defineTool<{ id: string; barrel_length_mm?: number; distances?: string }>({
  name: 'gunspec_ammunition_ballistics',
  title: 'Ballistic table for a load',
  description: 'Returns velocity, energy, drop and time of flight at a set of distances for one ammunition load, adjusted for barrel length.',
  tier: 'builder',
  example: { id: 'federal-hst-124jhp' },
  prompts: ['Show the ballistics of Federal HST 124 grain JHP.'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      id: SLUG('ammunition load'),
      barrel_length_mm: { type: 'number', description: 'Barrel length used to adjust muzzle velocity.' },
      distances: { type: 'string', description: 'Comma-separated distances in metres, e.g. "0,50,100,200".' },
    },
    required: ['id'],
    additionalProperties: false,
  },
  execute: async (client, { id, ...params }) => (await client.ammunition.ballistics(id, params)).data,
});

export const statsSummary = defineTool<Record<string, never>>({
  name: 'gunspec_stats_summary',
  title: 'Catalog summary',
  description: 'Returns the current number of firearms, manufacturers, calibers and categories in the catalog. Use this tool for any count. Never estimate a count.',
  tier: 'explorer',
  example: {},
  prompts: ['How many firearms, manufacturers and calibers are in the catalog?'],
  readOnly: true,
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  execute: async (client) => (await client.stats.summary()).data,
});

export const changelog = defineTool<{ category?: 'feature' | 'fix' | 'improvement' | 'data' | 'breaking'; per_page?: number }>({
  name: 'gunspec_changelog',
  title: 'API changelog',
  description: 'Lists recent changes to the API and catalog, newest first. No API key is required.',
  tier: 'public',
  example: { per_page: 5 },
  prompts: ['What has changed in the GunSpec API recently?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Return this category only.', enum: CHANGELOG_CATEGORIES },
      per_page: PER_PAGE,
    },
    additionalProperties: false,
  },
  execute: async (client, args) => (await client.content.listChangelog(args)).data,
});

export const REFERENCE_TOOLS = [
  listManufacturers, getManufacturer, manufacturerFirearms,
  listCalibers, getCaliber, caliberFirearms, listCategories,
  listAmmunition, ammunitionBallistics, statsSummary, changelog,
] as const;

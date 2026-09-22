/**
 * `gunspec_what_fits`: a firearm and a kind of part to what mounts on it, and where to buy it.
 *
 * @module
 */

import type { GunSpec } from '../../client';
import type { FirearmAttachments } from '../../types';
import { defineWorkflow } from '../types';
import { offerSummaries, unresolved } from './shared';

const ITEMS_PER_CATEGORY = 10;

function summarise(client: GunSpec, data: FirearmAttachments) {
  const offers = (data.offers ?? {}) as Record<string, Parameters<typeof offerSummaries>[1]>;
  return {
    firearm: data.firearm,
    platforms: data.platforms,
    mounts: data.interfaces.map((i) => ({ position: i.position, standard: i.name, source: i.source, confidence: i.confidence })),
    total: data.total,
    categories: data.groups.map((group) => ({
      category: group.category,
      count: group.items.length,
      items: group.items.slice(0, ITEMS_PER_CATEGORY).map((item) => ({
        id: item.id,
        name: item.name,
        manufacturer: item.manufacturer?.name ?? null,
        fitType: item.fitType,
        /* How it fits when it is not direct, in the catalog's own words. */
        via: item.adapter ? item.adapter.name : null,
        confidence: item.confidence,
        offers: offerSummaries(client, offers[item.id] ?? []),
      })),
    })),
  };
}

export const whatFits = defineWorkflow<{ firearm: string; category?: string; min_confidence?: number }>({
  name: 'gunspec_what_fits',
  title: 'What fits a firearm',
  description:
    'Workflow. Returns the optics, muzzle devices, stocks, grips and magazines that attach to a firearm, computed from its mounting interfaces, in a single call. Where a seller lists a part, the response includes where to buy it. Provide the firearm as the user named it and, optionally, a category ("optic", "muzzle", "stock"). The response contains the firearm\'s mounts, followed by up to ten compatible parts per category. Each part states how it fits (direct or through an adapter) and lists its offers. If the name matches more than one firearm, the tool returns the candidates instead. Replaces the resolve call, the attachments call and one offers call per part.',
  tier: 'studio',
  example: { firearm: 'AK-74M', category: 'optic' },
  prompts: ['Which optics fit an AK-74M?'],
  readOnly: true,
  steps: [{ call: 'firearms.resolve' }, { call: 'firearms.getAttachments' }],
  maxCalls: 2,
  inputSchema: {
    type: 'object',
    properties: {
      firearm: { type: 'string', description: 'The firearm name as the user wrote it, or a slug id.' },
      category: { type: 'string', description: 'One attachment category, e.g. "optic", "muzzle", "stock", "grip" or "magazine".' },
      min_confidence: {
        type: 'number',
        description: 'Hides fits derived from inferred data below this confidence (0 to 1).',
        minimum: 0,
        maximum: 1,
      },
    },
    required: ['firearm'],
    additionalProperties: false,
  },
  execute: async (client, { firearm, category, min_confidence }) => {
    const match = (await client.firearms.resolve(firearm)).data;
    if (match.status !== 'resolved' || !match.firearmId) return unresolved(match, firearm);

    const fits = await client.firearms.getAttachments(match.firearmId, {
      ...(category ? { category } : {}),
      ...(min_confidence !== undefined ? { min_confidence } : {}),
      with_offers: true,
    });
    return { resolved: true, ...summarise(client, fits.data) };
  },
});

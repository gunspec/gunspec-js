/**
 * `gunspec_cartridge_profile`: a cartridge name to its dimensions, lineage, loads and reach.
 *
 * @module
 */

import { NotFoundError } from '../../core/errors';
import type { Caliber } from '../../types';
import { defineWorkflow } from '../types';
import { optionalStep, type WorkflowGap } from './shared';

const LOAD_SAMPLE = 5;
const SEARCH_CANDIDATES = 5;

/** A slug is what a record id looks like; anything else is searched for. */
const looksLikeSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

const brief = (c: Caliber) => ({ id: c.id, name: c.name });

export const cartridgeProfile = defineWorkflow<{ caliber: string }>({
  name: 'gunspec_cartridge_profile',
  title: 'Cartridge profile',
  description:
    'Workflow. Returns a complete profile of one cartridge in a single call: its dimensions and pressure, its parent cartridge and the cartridges derived from it, its common loads, and the number of catalog firearms chambered for it. Provide the caliber as the user wrote it (".308", "9mm") or as a slug. If the name matches several cartridges, the tool returns the candidates. On plans below Builder, the lineage and loads are listed under `gaps` with the plan they require. Replaces the caliber lookup, family, ammunition and firearms calls.',
  tier: 'explorer',
  example: { caliber: '7-62x51mm-nato' },
  prompts: ['Give me a profile of the 7.62x51mm NATO cartridge.'],
  readOnly: true,
  steps: [
    { call: 'calibers.get' },
    { call: 'calibers.list' },
    { call: 'calibers.getFirearms' },
    { call: 'calibers.getFamily', optional: true },
    { call: 'calibers.getAmmunition', optional: true },
  ],
  maxCalls: 5,
  inputSchema: {
    type: 'object',
    properties: {
      caliber: { type: 'string', description: 'The cartridge as the user wrote it, e.g. ".308 Winchester", or a slug id.' },
    },
    required: ['caliber'],
    additionalProperties: false,
  },
  execute: async (client, { caliber }) => {
    const query = caliber.trim();
    let record: Caliber | null = null;

    if (looksLikeSlug(query)) {
      try {
        record = (await client.calibers.get(query)).data;
      } catch (error) {
        if (!(error instanceof NotFoundError)) throw error;
      }
    }
    if (!record) {
      const found = (await client.calibers.list({ q: query, per_page: SEARCH_CANDIDATES })).data;
      const exact = found.find((c) => c.name.toLowerCase() === query.toLowerCase() || c.id === query);
      if (!exact && found.length !== 1) {
        return { resolved: false, query, status: found.length === 0 ? 'unresolved' : 'ambiguous', candidates: found.map(brief) };
      }
      record = exact ?? found[0] ?? null;
      if (!record) return { resolved: false, query, status: 'unresolved', candidates: [] };
    }

    const id = record.id;
    const gaps: WorkflowGap[] = [];
    const [firearms, family, loads] = await Promise.all([
      client.calibers.getFirearms(id, { per_page: 1 }),
      optionalStep('calibers.getFamily', gaps, () => client.calibers.getFamily(id)),
      optionalStep('calibers.getAmmunition', gaps, () => client.calibers.getAmmunition(id, { per_page: LOAD_SAMPLE })),
    ]);

    return {
      resolved: true,
      caliber: {
        id: record.id,
        name: record.name,
        version: record.version,
        cartridgeType: record.cartridgeType,
        natoDesignation: record.natoDesignation,
        yearIntroduced: record.yearIntroduced,
        bulletDiameterMm: record.bulletDiameterMm,
        caseLengthMm: record.caseLengthMm,
        overallLengthMm: record.overallLengthMm,
        typicalBulletWeightG: record.typicalBulletWeightG,
        typicalMuzzleVelocityMps: record.typicalMuzzleVelocityMps,
        typicalMuzzleEnergyJ: record.typicalMuzzleEnergyJ,
        maxPressureMpa: record.maxPressureMpa,
      },
      firearmsChambered: firearms.pagination.total,
      lineage: family ? { ancestors: family.data.ancestors.map(brief), descendants: family.data.descendants.map(brief) } : null,
      commonLoads: loads
        ? {
            total: loads.pagination.total,
            sample: loads.data.map((a) => ({ id: a.id, name: a.name, bulletType: a.bulletType, bulletWeightG: a.bulletWeightG })),
          }
        : null,
      gaps,
    };
  },
});

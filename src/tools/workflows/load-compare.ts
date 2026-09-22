/**
 * `gunspec_load_compare`: a cartridge and a barrel to its loads ranked downrange.
 *
 * @module
 */

import type { BallisticProfile } from '../../types';
import { defineWorkflow } from '../types';

const MAX_LOADS = 8;
const DEFAULT_LOADS = 5;
const DEFAULT_DISTANCES = [0, 100, 200, 300];

export const loadCompare = defineWorkflow<{
  caliber_id: string; barrel_length_mm?: number; distances?: number[]; bullet_type?: string; limit?: number;
}>({
  name: 'gunspec_load_compare',
  title: 'Compare loads downrange',
  description:
    'Workflow. Compares the ammunition loads for one cartridge fired from the same barrel, in a single call. Returns velocity, energy and drop at each distance for every load, ranked by energy at the farthest distance. The flattest and hardest-hitting loads are identified. Provide the caliber slug (use gunspec_cartridge_profile or gunspec_list_calibers to find it) and, optionally, a barrel length, distances, a bullet type and the number of loads. Replaces one ammunition list call plus one ballistics call per load.',
  tier: 'builder',
  example: { caliber_id: '9x19mm-parabellum', barrel_length_mm: 114, distances: [0, 25, 50], limit: 3 },
  prompts: ['Compare three 9mm loads from a 114 mm barrel at 0, 25 and 50 metres.'],
  readOnly: true,
  steps: [{ call: 'ammunition.list' }, { call: 'ammunition.ballistics' }],
  maxCalls: MAX_LOADS + 1,
  inputSchema: {
    type: 'object',
    properties: {
      caliber_id: { type: 'string', description: 'The caliber slug, e.g. "9x19mm-parabellum".' },
      barrel_length_mm: { type: 'integer', description: 'Barrel length for every load, in mm (50 to 2000). Omit for each load\'s reference barrel.', minimum: 50, maximum: 2000 },
      distances: { type: 'array', description: 'Distances in metres. Defaults to 0, 100, 200 and 300.', items: { type: 'integer' } },
      bullet_type: { type: 'string', description: 'Return only loads of this bullet type, e.g. "JHP" or "FMJ".' },
      limit: { type: 'integer', description: 'Number of loads to compare, from 1 to 8.', minimum: 1, maximum: MAX_LOADS, default: DEFAULT_LOADS },
    },
    required: ['caliber_id'],
    additionalProperties: false,
  },
  execute: async (client, { caliber_id, barrel_length_mm, distances, bullet_type, limit = DEFAULT_LOADS }) => {
    const count = Math.min(Math.max(1, limit), MAX_LOADS);
    const range = (distances?.length ? distances : DEFAULT_DISTANCES).slice().sort((a, b) => a - b);
    const loads = (await client.ammunition.list({ caliber_id, per_page: count, ...(bullet_type ? { bullet_type } : {}) })).data;
    if (loads.length === 0) return { caliberId: caliber_id, loads: [], note: 'No loads are catalogued for this caliber and filter combination.' };

    const profiles = await Promise.all(
      loads.map((load) =>
        client.ammunition.ballistics(load.id, {
          distances: range.join(','),
          ...(barrel_length_mm ? { barrel_length_mm } : {}),
        }),
      ),
    );

    const farthest = range[range.length - 1] ?? 0;
    const at = (profile: BallisticProfile, distance: number) => profile.trajectory.find((p) => p.distanceM === distance);

    const rows = profiles.map(({ data }, index) => {
      const load = loads[index];
      return {
        id: data.ammunition.id,
        name: data.ammunition.name,
        bulletType: load?.bulletType ?? null,
        bulletWeightG: load?.bulletWeightG ?? null,
        barrelLengthMm: data.barrelLengthMm,
        muzzleVelocityMps: data.muzzleVelocityMps,
        muzzleEnergyJ: data.muzzleEnergyJ,
        effectiveRangeM: data.effectiveRangeM,
        trajectory: data.trajectory.map((p) => ({ distanceM: p.distanceM, velocityMps: p.velocityMps, energyJ: p.energyJ, dropCm: p.dropCm })),
        energyAtFarthestJ: at(data, farthest)?.energyJ ?? null,
        dropAtFarthestCm: at(data, farthest)?.dropCm ?? null,
      };
    });
    rows.sort((a, b) => (b.energyAtFarthestJ ?? -Infinity) - (a.energyAtFarthestJ ?? -Infinity));

    const flattest = rows
      .filter((r) => r.dropAtFarthestCm !== null)
      .sort((a, b) => Math.abs(a.dropAtFarthestCm ?? 0) - Math.abs(b.dropAtFarthestCm ?? 0))[0];

    return {
      caliberId: caliber_id,
      distancesM: range,
      loads: rows,
      leaders: {
        mostEnergyAtFarthest: rows[0] ? { id: rows[0].id, name: rows[0].name, energyJ: rows[0].energyAtFarthestJ } : null,
        flattest: flattest ? { id: flattest.id, name: flattest.name, dropCm: flattest.dropAtFarthestCm } : null,
      },
    };
  },
});

import { describe, it, expect } from 'vitest';
import { GUNSPEC_TOOLS, getTool, executeTool } from '../../src/tools';
import { PermissionError } from '../../src/core/errors';
import type { GunSpec } from '../../src/client';

/**
 * Workflows are held to what they publish: every SDK method they call is a
 * declared step, and no input makes one exceed its `maxCalls`. Both figures
 * reach customers - the steps on the docs, the ceiling as "costs up to N
 * requests" - so a workflow that quietly grew a call would bill more than it
 * says.
 */

type Handler = (...args: unknown[]) => unknown;

/** A client whose every resource method is recorded and answered from `answers`. */
function recordingClient(answers: Record<string, Handler>) {
  const calls: string[] = [];
  const client = new Proxy(
    {},
    {
      get: (_, resource) =>
        new Proxy(
          {},
          {
            get: (_, method) => async (...args: unknown[]) => {
              const key = `${String(resource)}.${String(method)}`;
              calls.push(key);
              const answer = answers[key];
              if (!answer) throw new Error(`unexpected call ${key}`);
              return answer(...args);
            },
          },
        ),
    },
  ) as unknown as GunSpec;
  return { client, calls };
}

const resolved = (id: string) => ({ data: { query: id, status: 'resolved', firearmId: id, alternatives: [] } });
const firearm = (id: string) => ({
  data: { id, name: id, version: 'v', manufacturer: { id: 'm', name: 'Maker' }, category: { name: 'Pistol' }, calibers: [], users: [] },
});

/** Answers covering every step of every workflow, with the widest data each can use. */
const FULL: Record<string, Handler> = {
  'firearms.resolve': (q) => resolved(String(q).toLowerCase().replace(/\s+/g, '-')),
  'firearms.get': (id) => firearm(String(id)),
  'firearms.getVariants': () => ({ data: [{ id: 'v1', name: 'V1' }] }),
  'firearms.listMedia': () => ({ data: [{ kind: 'photo', url: 'u' }] }),
  'firearms.compare': (params) => {
    const ids = String((params as { ids: string }).ids).split(',');
    return { data: { items: ids.map((id) => firearm(id).data), deltas: [{ field: 'weightEmptyG', values: ids.map((_, i) => 600 + i), min: 600, max: 600 + ids.length - 1, percentDiff: 1 }] } };
  },
  'firearms.getAttachments': () => ({
    data: { firearm: { id: 'f', name: 'F' }, platforms: [], interfaces: [], total: 1, groups: [{ category: 'optic', items: [{ id: 'a', name: 'A', manufacturer: { name: 'M' }, fitType: 'direct', adapter: null, confidence: 1 }] }], offers: {} },
  }),
  'vendor.clickUrl': (id) => `https://api.gunspec.io/v1/out/${String(id)}`,
  'calibers.get': (id) => ({ data: { id, name: String(id), version: 'v' } }),
  'calibers.list': () => ({ data: [{ id: 'c', name: 'C' }] }),
  'calibers.getFirearms': () => ({ data: [], pagination: { total: 12 } }),
  'calibers.getFamily': () => ({ data: { ancestors: [], current: {}, descendants: [] } }),
  'calibers.getAmmunition': () => ({ data: [], pagination: { total: 0 } }),
  'ammunition.list': (params) => ({
    data: Array.from({ length: (params as { per_page: number }).per_page }, (_, i) => ({ id: `load-${i}`, name: `L${i}` })),
  }),
  'ammunition.ballistics': (id) => ({
    data: { ammunition: { id, name: id }, barrelLengthMm: 100, muzzleVelocityMps: 300, muzzleEnergyJ: 500, effectiveRangeM: 50, trajectory: [{ distanceM: 0, velocityMps: 300, energyJ: 500, dropCm: 0 }] },
  }),
};

/** The inputs that make each workflow do the most work. */
const WIDEST: Record<string, Record<string, unknown>> = {
  gunspec_identify_firearm: { name: 'G19', detail: 'full' },
  gunspec_compare_by_name: { names: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] },
  gunspec_what_fits: { firearm: 'AK-74M', category: 'optic' },
  gunspec_cartridge_profile: { caliber: '.308 Winchester' },
  gunspec_load_compare: { caliber_id: '9mm', limit: 50, distances: [0, 50, 100] },
};

const workflows = GUNSPEC_TOOLS.filter((tool) => tool.kind === 'workflow');

describe('workflows', () => {
  it('declares steps and a request ceiling on every workflow', () => {
    expect(workflows.length).toBeGreaterThan(0);
    for (const workflow of workflows) {
      expect(workflow.steps?.length, workflow.name).toBeGreaterThan(0);
      expect(workflow.maxCalls, workflow.name).toBeGreaterThanOrEqual(workflow.steps?.length ?? 0);
    }
  });

  it('is listed before the single-call tools', () => {
    const firstTool = GUNSPEC_TOOLS.findIndex((tool) => tool.kind !== 'workflow');
    expect(GUNSPEC_TOOLS.slice(0, firstTool).every((tool) => tool.kind === 'workflow')).toBe(true);
  });

  for (const workflow of workflows) {
    it(`${workflow.name} calls only declared steps and stays within ${workflow.maxCalls} requests`, async () => {
      const { client, calls } = recordingClient(FULL);
      await executeTool(client, workflow.name, WIDEST[workflow.name] ?? workflow.example);
      /* `vendor.clickUrl` builds a URL and makes no request. */
      const requests = calls.filter((call) => call !== 'vendor.clickUrl');
      const declared = new Set(workflow.steps?.map((step) => step.call));
      for (const call of requests) expect(declared.has(call), `${workflow.name} made undeclared call ${call}`).toBe(true);
      expect(requests.length).toBeLessThanOrEqual(workflow.maxCalls ?? 0);
    });
  }
});

describe('gunspec_identify_firearm', () => {
  it('returns candidates instead of guessing when the name is ambiguous', async () => {
    const { client, calls } = recordingClient({
      'firearms.resolve': () => ({
        data: { query: 'G19', status: 'ambiguous', firearmId: null, alternatives: [{ firearmId: 'glock-19-gen5', name: 'Glock 19 Gen5', manufacturerName: 'Glock' }] },
      }),
    });
    const result = (await executeTool(client, 'gunspec_identify_firearm', { name: 'G19' })) as { resolved: boolean; candidates: unknown[] };
    expect(result.resolved).toBe(false);
    expect(result.candidates).toEqual([{ id: 'glock-19-gen5', name: 'Glock 19 Gen5', manufacturer: 'Glock' }]);
    expect(calls).toEqual(['firearms.resolve']);
  });
});

describe('gunspec_cartridge_profile', () => {
  it('reports a step the plan does not cover as a gap and still answers', async () => {
    const refused = new PermissionError('FORBIDDEN', 'Builder plan required', 'req', new Headers(), {
      reason: 'PLAN_REQUIRED',
      details: { requiredTier: 'builder' },
    });
    const { client } = recordingClient({
      ...FULL,
      'calibers.getFamily': () => Promise.reject(refused),
      'calibers.getAmmunition': () => Promise.reject(refused),
    });
    const result = (await executeTool(client, 'gunspec_cartridge_profile', { caliber: '7-62x51mm-nato' })) as {
      resolved: boolean; firearmsChambered: number; lineage: unknown; gaps: Array<{ step: string; reason: string; requiredTier?: string }>;
    };
    expect(result.resolved).toBe(true);
    expect(result.firearmsChambered).toBe(12);
    expect(result.lineage).toBeNull();
    expect(result.gaps).toEqual([
      { step: 'calibers.getFamily', reason: 'PLAN_REQUIRED', message: 'Builder plan required', requiredTier: 'builder' },
      { step: 'calibers.getAmmunition', reason: 'PLAN_REQUIRED', message: 'Builder plan required', requiredTier: 'builder' },
    ]);
  });
});

describe('gunspec_compare_by_name', () => {
  it('does not call compare when fewer than two names resolve', async () => {
    const { client, calls } = recordingClient({
      'firearms.resolve': (q) =>
        q === 'glock 17' ? resolved('glock-g17') : { data: { query: q, status: 'unresolved', firearmId: null, alternatives: [] } },
    });
    const result = (await executeTool(client, 'gunspec_compare_by_name', { names: ['glock 17', 'nothing'] })) as { compared: boolean };
    expect(result.compared).toBe(false);
    expect(calls).not.toContain('firearms.compare');
  });

  it('is found by name', () => {
    expect(getTool('gunspec_compare_by_name')?.kind).toBe('workflow');
  });
});

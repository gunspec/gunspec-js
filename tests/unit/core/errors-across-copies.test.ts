import { describe, it, expect, vi } from 'vitest';
import type { GunSpec } from '../../../src/client';

/**
 * The package ships two entries, and a bundler or runtime can give each its own
 * copy of the error classes. An error from one copy used to fail `instanceof`
 * against the other: the tool workflows' `instanceof APIError` never matched an
 * error thrown by the client, so an optional step refused on a lower plan
 * failed the whole workflow. These load the modules twice to reproduce that.
 */

async function freshErrors() {
  vi.resetModules();
  return import('../../../src/core/errors');
}

const headers = new Headers();
const planRequired = (errors: Awaited<ReturnType<typeof freshErrors>>) =>
  new errors.PermissionError('FORBIDDEN', 'Builder plan required', 'req', headers, {
    reason: 'PLAN_REQUIRED',
    details: { requiredTier: 'builder' },
  });

describe('instanceof across copies of the SDK', () => {
  it('matches the class and every ancestor, and nothing else', async () => {
    const one = await freshErrors();
    const two = await freshErrors();
    expect(one.PermissionError).not.toBe(two.PermissionError);

    const error = planRequired(one);
    expect(error instanceof two.PermissionError).toBe(true);
    expect(error instanceof two.APIError).toBe(true);
    expect(error instanceof two.GunSpecError).toBe(true);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof two.NotFoundError).toBe(false);
    expect(error instanceof two.ConnectionError).toBe(false);
  });

  it('does not match a plain object or an unrelated error', async () => {
    const errors = await freshErrors();
    expect({} instanceof errors.APIError).toBe(false);
    expect(new Error('x') instanceof errors.GunSpecError).toBe(false);
  });

  it('lets a workflow treat a refused optional step from another copy as a gap', async () => {
    const clientCopy = await freshErrors();
    vi.resetModules();
    const { executeTool } = await import('../../../src/tools');

    const refused = planRequired(clientCopy);
    const client = {
      calibers: {
        get: async (id: string) => ({ data: { id, name: '7.62x51mm NATO', version: 'v' } }),
        getFirearms: async () => ({ data: [], pagination: { total: 244 } }),
        getFamily: () => Promise.reject(refused),
        getAmmunition: () => Promise.reject(refused),
      },
    } as unknown as GunSpec;

    const result = (await executeTool(client, 'gunspec_cartridge_profile', { caliber: '7-62x51mm-nato' })) as {
      resolved: boolean;
      firearmsChambered: number;
      gaps: Array<{ step: string; reason: string; requiredTier?: string }>;
    };
    expect(result.resolved).toBe(true);
    expect(result.firearmsChambered).toBe(244);
    expect(result.gaps.map((gap) => [gap.step, gap.reason, gap.requiredTier])).toEqual([
      ['calibers.getFamily', 'PLAN_REQUIRED', 'builder'],
      ['calibers.getAmmunition', 'PLAN_REQUIRED', 'builder'],
    ]);
  });
});

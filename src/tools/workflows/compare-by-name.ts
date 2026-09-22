/**
 * `gunspec_compare_by_name`: loosely named firearms to the differences between them.
 *
 * @module
 */

import { defineWorkflow } from '../types';
import { unresolved, type Unresolved } from './shared';

/** The compare endpoint's own ceiling. */
const MAX_FIREARMS = 5;

export const compareByName = defineWorkflow<{ names: string[] }>({
  name: 'gunspec_compare_by_name',
  title: 'Compare firearms by name',
  description:
    'Workflow. Compares two to five firearms, named as the user wrote them ("G19", "P320 Compact"), in a single call. Each name is resolved to a record, and only the figures that differ are returned. The lightest, shortest and highest-capacity firearms are identified. Names that do not match a single record are listed under `unresolved` with their candidates and are never guessed. Replaces one resolve call per name plus one compare call.',
  tier: 'builder',
  example: { names: ['Glock 17', 'Beretta 92FS'] },
  prompts: ['Compare the Glock 17 and the Beretta 92FS.'],
  readOnly: true,
  steps: [{ call: 'firearms.resolve' }, { call: 'firearms.compare' }],
  maxCalls: MAX_FIREARMS + 1,
  inputSchema: {
    type: 'object',
    properties: {
      names: {
        type: 'array',
        description: 'Two to five firearm names or slug ids. Names beyond the fifth are ignored.',
        items: { type: 'string' },
      },
    },
    required: ['names'],
    additionalProperties: false,
  },
  execute: async (client, { names }) => {
    const wanted = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, MAX_FIREARMS);
    const matches = await Promise.all(wanted.map(async (name) => ({ name, match: (await client.firearms.resolve(name)).data })));

    const ids: string[] = [];
    const unresolvedNames: Unresolved[] = [];
    for (const { name, match } of matches) {
      if (match.status === 'resolved' && match.firearmId) {
        if (!ids.includes(match.firearmId)) ids.push(match.firearmId);
      } else {
        unresolvedNames.push(unresolved(match, name));
      }
    }

    if (ids.length < 2) {
      return { compared: false, reason: 'Fewer than two names resolved to a single firearm.', resolvedIds: ids, unresolved: unresolvedNames };
    }

    const { items, deltas } = (await client.firearms.compare({ ids: ids.join(',') })).data;
    const byField = new Map(deltas.map((d) => [d.field, d]));
    /* The record the smallest (or largest) value of a field belongs to. */
    const leader = (field: string, pick: 'min' | 'max') => {
      const delta = byField.get(field);
      if (!delta) return null;
      const index = delta.values.indexOf(delta[pick]);
      const item = items[index];
      return item ? { id: item.id, name: item.name, value: delta[pick] } : null;
    };

    return {
      compared: true,
      firearms: items.map((f) => ({
        id: f.id,
        name: f.name,
        version: f.version,
        manufacturer: f.manufacturer?.name ?? null,
        primaryCaliber: (f.calibers ?? []).find((c) => c.isPrimary)?.name ?? f.calibers?.[0]?.name ?? null,
      })),
      /* Only what differs; each `values` entry lines up with `firearms`. */
      differences: deltas.map((d) => ({ field: d.field, values: d.values, min: d.min, max: d.max, percentDiff: d.percentDiff })),
      leaders: {
        lightest: leader('weightEmptyG', 'min'),
        shortest: leader('overallLengthMm', 'min'),
        highestCapacity: leader('magazineCapacity', 'max'),
      },
      unresolved: unresolvedNames,
    };
  },
});

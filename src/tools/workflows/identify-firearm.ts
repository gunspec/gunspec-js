/**
 * `gunspec_identify_firearm`: a loosely named firearm to one compact spec card.
 *
 * @module
 */

import type { FirearmDetail } from '../../types';
import { defineWorkflow } from '../types';
import { DETAIL, optionalStep, unresolved, type Detail, type WorkflowGap } from './shared';

const VARIANT_SAMPLE = 5;
const USER_SAMPLE = 8;

/** The fields a spec question is usually about, and nothing a model has to read past. */
function card(f: FirearmDetail, detail: Detail) {
  const base = {
    id: f.id,
    name: f.name,
    version: f.version,
    manufacturer: f.manufacturer ? { id: f.manufacturer.id, name: f.manufacturer.name } : null,
    category: f.category?.name ?? null,
    actionType: f.actionType,
    status: f.status,
    countryOfOrigin: f.countryOfOrigin,
    yearIntroduced: f.yearIntroduced,
    yearDiscontinued: f.yearDiscontinued,
    designer: f.designer,
    calibers: (f.calibers ?? []).map((c) => ({ id: c.caliberId, name: c.name, isPrimary: c.isPrimary })),
    magazineCapacity: f.magazineCapacity,
    weightEmptyG: f.weightEmptyG,
    overallLengthMm: f.overallLengthMm,
    barrelLengthMm: f.barrelLengthMm,
    muzzleVelocityMps: f.muzzleVelocityMps,
    effectiveRangeM: f.effectiveRangeM,
    dataConfidence: f.dataConfidence,
  };
  if (detail === 'summary') return base;
  return {
    ...base,
    description: f.description,
    features: f.features,
    firingModes: f.firingModes,
    heightMm: f.heightMm,
    widthMm: f.widthMm,
    weightLoadedG: f.weightLoadedG,
    users: (f.users ?? []).slice(0, USER_SAMPLE).map((u) => ({ name: u.userName, country: u.countryCode, year: u.adoptedYear })),
    sources: f.provenance?.sources ?? [],
  };
}

export const identifyFirearm = defineWorkflow<{ name: string; detail?: Detail }>({
  name: 'gunspec_identify_firearm',
  title: 'Identify a firearm',
  description:
    'Workflow. Converts an informally written firearm name ("G19 gen 5", "M4A1") into one specification card in a single call. The card contains the matched record\'s key figures, calibers, variant count and first image. If the name matches more than one record, the tool returns the candidates instead of guessing. Ask the user which one they meant, then call the tool again with that id. Replaces the resolve, get, variants and media calls. Needs the Builder plan.',
  tier: 'builder',
  example: { name: 'Glock 17' },
  prompts: ['Tell me everything about the Glock 17.', 'What is a Glock 17, and which variants of it exist?'],
  readOnly: true,
  steps: [
    { call: 'firearms.resolve' },
    { call: 'firearms.get' },
    { call: 'firearms.getVariants', optional: true },
    { call: 'firearms.listMedia', optional: true },
  ],
  maxCalls: 4,
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The firearm name as the user wrote it, or a slug id.' },
      detail: DETAIL,
    },
    required: ['name'],
    additionalProperties: false,
  },
  execute: async (client, { name, detail = 'summary' }) => {
    const match = (await client.firearms.resolve(name)).data;
    if (match.status !== 'resolved' || !match.firearmId) return unresolved(match, name);

    const id = match.firearmId;
    const gaps: WorkflowGap[] = [];
    const [firearm, variants, media] = await Promise.all([
      client.firearms.get(id),
      optionalStep('firearms.getVariants', gaps, () => client.firearms.getVariants(id)),
      optionalStep('firearms.listMedia', gaps, () => client.firearms.listMedia(id)),
    ]);

    return {
      resolved: true,
      firearm: card(firearm.data, detail),
      variants: variants
        ? { count: variants.data.length, sample: variants.data.slice(0, VARIANT_SAMPLE).map((v) => ({ id: v.id, name: v.name })) }
        : null,
      media: media ? { count: media.data.length, first: media.data[0] ? { kind: media.data[0].kind, url: media.data[0].url } : null } : null,
      gaps,
    };
  },
});

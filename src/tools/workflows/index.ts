/**
 * Workflows: tools that make several SDK calls and return one combined answer.
 *
 * @module
 */

import { cartridgeProfile } from './cartridge-profile';
import { compareByName } from './compare-by-name';
import { identifyFirearm } from './identify-firearm';
import { loadCompare } from './load-compare';
import { whatFits } from './what-fits';

export type { WorkflowGap, Detail } from './shared';

/** Every workflow, in the order a host should list them. */
export const WORKFLOW_TOOLS = [identifyFirearm, compareByName, whatFits, cartridgeProfile, loadCompare] as const;

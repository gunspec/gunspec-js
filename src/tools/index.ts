/**
 * Tool manifest: the GunSpec API restated as tools an agent can call.
 *
 * Every entry names one read-only question the catalog answers, describes it
 * for a model, declares its arguments as JSON Schema, states the plan it
 * needs, and knows how to run itself over a {@link GunSpec} client. An MCP
 * server, an Anthropic or OpenAI function-calling loop, or a custom agent
 * host lists these and dispatches through {@link executeTool}; none of them
 * has to know a path.
 *
 * Import from `@buun_group/gunspec-sdk/tools`.
 *
 * @example
 * ```ts
 * import { GunSpec } from '@buun_group/gunspec-sdk';
 * import { GUNSPEC_TOOLS, executeTool, asAnthropicTools } from '@buun_group/gunspec-sdk/tools';
 *
 * const client = new GunSpec();
 * const tools = asAnthropicTools();           // pass to messages.create({ tools })
 * const result = await executeTool(client, 'gunspec_get_firearm', { id: 'ak-47' });
 * ```
 *
 * @module
 */

import type { GunSpec } from '../client';
import { CATALOG_TOOLS } from './catalog';
import { REFERENCE_TOOLS } from './reference';
import { COMPAT_TOOLS } from './compat';
import { DOCS_TOOLS } from './docs';
import { WORKFLOW_TOOLS } from './workflows';
import type { JsonSchemaObject, ToolDefinition, ToolTier } from './types';

export type { ToolDefinition, ToolTier, JsonSchemaObject, JsonSchemaProperty, WorkflowStep } from './types';
export { defineTool, defineWorkflow } from './types';
export type { WorkflowGap } from './workflows';
/** The workflow tools alone, for a host that offers only multi-call tools. */
export { WORKFLOW_TOOLS };

/**
 * Every tool, in the order a host should list them. Workflows first: a model
 * reads the list top down, and one workflow call is cheaper than the several
 * single tools it replaces.
 */
export const GUNSPEC_TOOLS: readonly ToolDefinition[] = [
  ...WORKFLOW_TOOLS,
  ...CATALOG_TOOLS,
  ...REFERENCE_TOOLS,
  ...COMPAT_TOOLS,
  ...DOCS_TOOLS,
] as readonly ToolDefinition[];

const BY_NAME = new Map<string, ToolDefinition>(GUNSPEC_TOOLS.map((t) => [t.name, t]));

/** Look a tool up by name, or `undefined`. */
export function getTool(name: string): ToolDefinition | undefined {
  return BY_NAME.get(name);
}

/** Thrown by {@link executeTool} for a name not in the manifest. */
export class UnknownToolError extends Error {
  override readonly name = 'UnknownToolError';
  constructor(readonly toolName: string) {
    super(`Unknown tool: ${toolName}`);
  }
}

/**
 * Run one tool by name. Arguments are passed through as the host parsed
 * them; the API validates and answers 400 with `details` for a bad value,
 * which surfaces as a {@link BadRequestError}.
 */
export async function executeTool(client: GunSpec, name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const tool = getTool(name);
  if (!tool) throw new UnknownToolError(name);
  return tool.execute(client, args);
}

/** The order plans stack in, for filtering. */
const TIER_RANK: Record<ToolTier, number> = { public: 0, explorer: 1, builder: 2, studio: 3, enterprise: 4 };

/** Only the tools a plan can reach, so a host does not advertise a 403. */
export function toolsForTier(tier: ToolTier): ToolDefinition[] {
  return GUNSPEC_TOOLS.filter((t) => TIER_RANK[t.tier] <= TIER_RANK[tier]);
}

/** Anthropic Messages API `tools` entries. */
export function asAnthropicTools(tools: readonly ToolDefinition[] = GUNSPEC_TOOLS): Array<{
  name: string; description: string; input_schema: JsonSchemaObject;
}> {
  return tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));
}

/** OpenAI Chat Completions `tools` entries. */
export function asOpenAITools(tools: readonly ToolDefinition[] = GUNSPEC_TOOLS): Array<{
  type: 'function'; function: { name: string; description: string; parameters: JsonSchemaObject };
}> {
  return tools.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.inputSchema },
  }));
}

/**
 * MCP `tools/list` entries. `annotations` carries the read-only hint so a
 * client can run these without confirmation prompts.
 */
export function asMcpTools(tools: readonly ToolDefinition[] = GUNSPEC_TOOLS): Array<{
  name: string; title: string; description: string; inputSchema: JsonSchemaObject;
  annotations: { title: string; readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean };
}> {
  return tools.map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: { title: t.title, readOnlyHint: t.readOnly, destructiveHint: !t.readOnly, idempotentHint: t.readOnly, openWorldHint: false },
  }));
}

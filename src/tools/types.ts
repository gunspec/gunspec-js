/**
 * The shape of a tool: what an agent host (an MCP server, a function-calling
 * loop) needs to advertise it, and how the SDK runs it.
 *
 * Input schemas are plain JSON Schema objects written by hand and kept small.
 * Nothing here imports a schema library, so the manifest adds no dependency
 * to the SDK and can be serialised straight into a `tools/list` reply.
 *
 * @module
 */

import type { GunSpec } from '../client';

/** The plan a tool's endpoint needs. Stated so a host can hide what a key cannot reach. */
export type ToolTier = 'public' | 'explorer' | 'builder' | 'studio' | 'enterprise';

/** A JSON Schema fragment for one argument. */
export interface JsonSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array';
  description: string;
  enum?: readonly string[];
  items?: { type: 'string' | 'number' | 'integer' };
  minimum?: number;
  maximum?: number;
  /* The bounds the API enforces on a string argument, declared so a client
     refuses the call rather than spending a round trip on a 400. */
  minLength?: number;
  maxLength?: number;
  default?: string | number | boolean;
}

/** A JSON Schema `object` describing a tool's arguments. */
export interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: readonly string[];
  additionalProperties: false;
}

/** One tool in the manifest. */
export interface ToolDefinition<TArgs extends Record<string, unknown> = Record<string, unknown>> {
  /** Stable, snake_case, prefixed `gunspec_`. Never renamed. */
  readonly name: string;
  /** Short human title. */
  readonly title: string;
  /** What it answers and when to reach for it, written for a model. */
  readonly description: string;
  readonly inputSchema: JsonSchemaObject;
  readonly tier: ToolTier;
  /**
   * Every tool in the manifest reads the catalog and changes nothing. Stated
   * per tool so a host can pass it through as an annotation, and so a future
   * write tool has to say so explicitly.
   */
  readonly readOnly: boolean;
  /**
   * Arguments that make this tool return real data, with record ids the
   * catalog holds. Shown on the docs as the tool's example call, and what the
   * hosted MCP server's nightly check calls each tool with, so an example that
   * stops resolving fails a run rather than quietly teaching a call that 404s.
   */
  readonly example: TArgs;
  /**
   * What a person might ask that this tool answers, matching `example`: the
   * docs show each as the prompt that leads to the example call and its
   * response. At least one; plain requests, not instructions to the model.
   */
  readonly prompts: readonly string[];
  /**
   * `tool` makes one SDK call; `workflow` makes several and returns one
   * combined answer, so a model spends one turn instead of several. Absent
   * means `tool`.
   */
  readonly kind?: 'tool' | 'workflow';
  /**
   * A workflow's steps: every SDK method it may call, and whether the answer
   * still stands without it. An optional step the caller's plan does not cover
   * is reported in `gaps` rather than failing the workflow. Declared rather
   * than inferred so the docs and the generator can hold the workflow's `tier`
   * to its required steps.
   */
  readonly steps?: readonly WorkflowStep[];
  /**
   * The most API requests one call of this workflow can make. Each counts
   * against the plan's allowance exactly as a direct request would, so the
   * figure is published beside the workflow and a test holds the code to it.
   */
  readonly maxCalls?: number;
  /** Run it. Resolves to the value to hand back, already unwrapped. */
  execute(client: GunSpec, args: TArgs): Promise<unknown>;
}

/** One SDK method a workflow calls, as `resource.method`. */
export interface WorkflowStep {
  readonly call: string;
  /** The workflow answers without it, and says what is missing. */
  readonly optional?: boolean;
}

/** Identity helper so a tool literal is checked against its own argument type. */
export function defineTool<TArgs extends Record<string, unknown>>(tool: ToolDefinition<TArgs>): ToolDefinition<TArgs> {
  return tool;
}

/** A workflow: a tool that must declare its steps and its request ceiling. */
export function defineWorkflow<TArgs extends Record<string, unknown>>(
  workflow: ToolDefinition<TArgs> & { steps: readonly WorkflowStep[]; maxCalls: number },
): ToolDefinition<TArgs> {
  return { ...workflow, kind: 'workflow' };
}

/** Common argument fragments. */
export const PAGE: JsonSchemaProperty = { type: 'integer', description: 'Page number, from 1.', minimum: 1, default: 1 };
export const PER_PAGE: JsonSchemaProperty = { type: 'integer', description: 'Items per page, 1 to 100.', minimum: 1, maximum: 100, default: 20 };
export const SLUG = (what: string): JsonSchemaProperty => ({
  type: 'string',
  description: `The ${what} slug, e.g. as returned by a list or search tool.`,
});

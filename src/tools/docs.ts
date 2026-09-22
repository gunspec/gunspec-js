/**
 * Docs tools: how to call the GunSpec API correctly, answered from the
 * reference itself.
 *
 * An agent asked to write code against GunSpec otherwise works from memory.
 * These return what the documentation defines: an operation's parameters,
 * plan and failures, the sample the reference prints and CI runs, and the
 * plan limits the API enforces. None of them composes anything.
 *
 * @module
 */

import { defineTool } from './types';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const SAMPLE_LANGUAGES = ['curl', 'javascript', 'python', 'unity', 'unreal', 'godot', 'sdk-typescript', 'sdk-python'] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];
type SampleLanguage = (typeof SAMPLE_LANGUAGES)[number];

export const apiOperation = defineTool<{ path: string; method?: HttpMethod }>({
  name: 'gunspec_api_operation',
  title: 'Look up an API operation',
  description:
    'Returns what the GunSpec API reference documents for an endpoint: its parameters and accepted values, the plan it needs, whether a key is required, caching, every error status with the error.reason values to branch on, and the languages a sample is printed in. Use this tool before writing or explaining code that calls the GunSpec API, instead of recalling parameters. The path may be a template (/v1/firearms/{id}), a concrete path or a URL; a partial path such as /v1/vendor lists the operations under it.',
  tier: 'explorer',
  example: { path: '/v1/firearms/{id}', method: 'GET' },
  prompts: ['What parameters does the GunSpec endpoint for a single firearm take, and what errors can it return?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'The endpoint path, e.g. "/v1/firearms/{id}", "/v1/firearms/glock-g17" or a full URL.' },
      method: { type: 'string', description: 'HTTP method, when the path answers more than one.', enum: HTTP_METHODS },
    },
    required: ['path'],
    additionalProperties: false,
  },
  execute: async (client, { path, method }) => (await client.docs.getOperations({ path, method })).data,
});

export const codeSample = defineTool<{ path: string; method?: HttpMethod; language: SampleLanguage }>({
  name: 'gunspec_code_sample',
  title: 'Get a verified code sample',
  description:
    'Returns the code sample the GunSpec API reference prints for an endpoint in one language, exactly as printed, with when it was last checked against production. Languages: curl, javascript (TypeScript with fetch), python (requests), unity, unreal, godot, sdk-typescript and sdk-python for the official SDKs. Use this tool when the user wants code that calls the GunSpec API, and give them the sample as returned rather than writing one. Replace your_key with the user\'s key as the keyNote says.',
  tier: 'explorer',
  example: { path: '/v1/firearms', method: 'GET', language: 'python' },
  prompts: ['Show me how to list firearms from the GunSpec API in Python.'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'The endpoint path, e.g. "/v1/firearms" or "/v1/firearms/{id}".' },
      method: { type: 'string', description: 'HTTP method, when the path answers more than one.', enum: HTTP_METHODS },
      language: { type: 'string', description: 'The language or SDK the sample is wanted in.', enum: SAMPLE_LANGUAGES },
    },
    required: ['path', 'language'],
    additionalProperties: false,
  },
  execute: async (client, { path, method, language }) => (await client.docs.getSample({ path, method, language })).data,
});

export const planLimits = defineTool<Record<string, never>>({
  name: 'gunspec_plan_limits',
  title: 'Plan limits',
  description:
    'Returns what each GunSpec plan allows, from the configuration the API enforces: requests per minute, per day and per month, MCP calls per day, paging depth, whether lists include a total count, how long to wait after a 429, and the headers a key is sent in. Use this tool for any question about rate limits, quotas or which plan a workload needs. Never estimate a limit.',
  tier: 'explorer',
  example: {},
  prompts: ['How many requests a minute and a day does each GunSpec plan allow?'],
  readOnly: true,
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  execute: async (client) => (await client.docs.getLimits()).data,
});

export const searchDocs = defineTool<{ question: string; limit?: number }>({
  name: 'gunspec_search_docs',
  title: 'Search the GunSpec documentation',
  description:
    "Searches the GunSpec documentation guides and returns the sections that answer a question, best first, each with a snippet and a link. Use this tool whenever the user asks how something works or how they should do something with GunSpec - rate limits and retries, pagination, caching and ETags, authentication and keys, webhooks, errors and what a reason means, plans and pricing, data quality - instead of answering from memory. Then call gunspec_read_docs with the guide and anchor of the best hit to read it in full. A question the documentation does not cover returns no results, which means the answer is not in the docs rather than that a near-enough one should be given.",
  tier: 'explorer',
  example: { question: 'how should I handle a 429 rate limit' },
  prompts: ['How should I handle rate limiting when calling the GunSpec API?'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      question: { type: 'string', description: "The question, in the user's own words.", minLength: 2, maxLength: 200 },
      limit: { type: 'integer', description: 'How many sections to return. 8 by default.', minimum: 1, maximum: 25 },
    },
    required: ['question'],
    additionalProperties: false,
  },
  execute: async (client, { question, limit }) => (await client.docs.searchGuides({ q: question, limit })).data,
});

export const readDocs = defineTool<{ guide: string; anchor?: string }>({
  name: 'gunspec_read_docs',
  title: 'Read a GunSpec documentation guide',
  description:
    'Returns one GunSpec documentation guide as Markdown. Pass the anchor of a section from gunspec_search_docs to read just that section, which is what an answer usually needs; omit it for the whole page, which can run to tens of kilobytes. Quote what this returns rather than paraphrasing from memory, and cite the url. Call gunspec_search_docs first unless the guide id is already known.',
  tier: 'explorer',
  example: { guide: 'caching', anchor: 'caching-policy' },
  prompts: ['Read the GunSpec caching guide and tell me how long I may keep a firearm record.'],
  readOnly: true,
  inputSchema: {
    type: 'object',
    properties: {
      guide: { type: 'string', description: 'The guide id, e.g. "caching", "pagination", "errors" or "rate-limits".' },
      anchor: { type: 'string', description: 'A section anchor from gunspec_search_docs. Omitted, the whole page is returned.' },
    },
    required: ['guide'],
    additionalProperties: false,
  },
  execute: async (client, { guide, anchor }) => (await client.docs.getGuide(guide, { anchor })).data,
});

export const DOCS_TOOLS = [apiOperation, codeSample, planLimits, searchDocs, readDocs] as const;

import { describe, it, expect, vi } from 'vitest';
import {
  GUNSPEC_TOOLS,
  getTool,
  executeTool,
  toolsForTier,
  asAnthropicTools,
  asOpenAITools,
  asMcpTools,
  UnknownToolError,
} from '../../src/tools';
import { GunSpec } from '../../src/client';

/** A GunSpec whose transport records calls and answers with a fixed envelope. */
function stubClient() {
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    const body = u.includes('/offers') && !u.includes('/vendor/')
      ? { success: true, data: [{ sku: 'A', clickId: 'clk_1', priceCents: 100, currency: 'AUD' }, { sku: 'B', clickId: null }] }
      : init?.method === 'POST'
        ? { success: true, data: { results: [] } }
        : u.includes('per_page') || u.includes('/v1/attachments?') || u.endsWith('/v1/firearms') || u.includes('/v1/firearms?')
          ? { success: true, data: [{ id: 'x' }], pagination: { page: 1, limit: 20, per_page: 20 } }
          : { success: true, data: { id: 'x', url: u } };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  const client = new GunSpec({ apiKey: 'gsk_test', fetch: fetchMock as unknown as typeof fetch, retry: { maxRetries: 0 } });
  return { client, fetchMock, lastUrl: () => String(fetchMock.mock.calls.at(-1)![0]) };
}

describe('GUNSPEC_TOOLS manifest', () => {
  it('has unique, prefixed, snake_case names', () => {
    const names = GUNSPEC_TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n).toMatch(/^gunspec_[a-z_]+$/);
  });

  it('declares a closed object schema whose required keys exist', () => {
    for (const t of GUNSPEC_TOOLS) {
      expect(t.inputSchema.type, t.name).toBe('object');
      expect(t.inputSchema.additionalProperties, t.name).toBe(false);
      for (const r of t.inputSchema.required ?? []) expect(t.inputSchema.properties, `${t.name}.${r}`).toHaveProperty(r);
      expect(t.description.length, t.name).toBeGreaterThan(40);
      expect(t.readOnly, t.name).toBe(true);
    }
  });

  it('gives every tool an example that its own schema accepts', () => {
    for (const tool of GUNSPEC_TOOLS) {
      const { properties, required = [] } = tool.inputSchema;
      const example = tool.example as Record<string, unknown>;
      for (const key of required) expect(example, `${tool.name} example lacks ${key}`).toHaveProperty(key);
      for (const [key, value] of Object.entries(example)) {
        const prop = properties[key];
        expect(prop, `${tool.name} example names unknown argument ${key}`).toBeDefined();
        if (!prop) continue;
        const type = Array.isArray(value) ? 'array' : Number.isInteger(value) ? 'integer' : typeof value;
        expect([prop.type, prop.type === 'number' && type === 'integer' ? 'integer' : prop.type], `${tool.name}.${key}`).toContain(type);
        if (prop.enum) expect(prop.enum, `${tool.name}.${key}`).toContain(value);
        if (typeof value === 'number' && prop.minimum !== undefined) expect(value).toBeGreaterThanOrEqual(prop.minimum);
        if (typeof value === 'number' && prop.maximum !== undefined) expect(value).toBeLessThanOrEqual(prop.maximum);
      }
    }
  });

  it('gives every tool at least one plain prompt a person might ask', () => {
    for (const tool of GUNSPEC_TOOLS) {
      expect(tool.prompts.length, tool.name).toBeGreaterThan(0);
      for (const prompt of tool.prompts) {
        expect(prompt.trim(), tool.name).toBe(prompt);
        expect(prompt.length, tool.name).toBeGreaterThan(10);
        expect(prompt, tool.name).not.toMatch(/ - |gunspec_/);
      }
    }
  });

  it('quotes no catalog count in a description', () => {
    for (const t of GUNSPEC_TOOLS) expect(t.description, t.name).not.toMatch(/\d{1,3}(,\d{3})+\+? firearms/);
  });

  it('is looked up by name', () => {
    expect(getTool('gunspec_get_firearm')?.tier).toBe('builder');
    expect(getTool('nope')).toBeUndefined();
  });
});

describe('executeTool', () => {
  it('dispatches to the SDK and returns unwrapped data', async () => {
    const { client, lastUrl } = stubClient();
    const result = await executeTool(client, 'gunspec_get_firearm', { id: 'ak-47' });
    expect(lastUrl()).toBe('https://api.gunspec.io/v1/firearms/ak-47');
    expect(result).toMatchObject({ id: 'x' });
  });

  it('serialises list arguments into the query', async () => {
    const { client, lastUrl } = stubClient();
    const result = await executeTool(client, 'gunspec_list_firearms', { manufacturer: 'glock', per_page: 5 });
    expect(lastUrl()).toBe('https://api.gunspec.io/v1/firearms?manufacturer=glock&per_page=5');
    expect(result).toEqual({ firearms: [{ id: 'x' }], pagination: { page: 1, limit: 20, per_page: 20 } });
  });

  it('joins compare ids and posts resolve batches', async () => {
    const { client, lastUrl, fetchMock } = stubClient();
    await executeTool(client, 'gunspec_compare_firearms', { ids: ['a', 'b'] });
    expect(lastUrl()).toBe('https://api.gunspec.io/v1/firearms/compare?ids=a%2Cb');
    await executeTool(client, 'gunspec_resolve_firearm', { name: 'G19' });
    expect(lastUrl()).toBe('https://api.gunspec.io/v1/firearms/resolve?q=G19');
    expect(fetchMock.mock.calls.at(-1)![1]?.method).toBe('GET');
  });

  it('attaches a tracked href to each offer', async () => {
    const { client } = stubClient();
    const offers = (await executeTool(client, 'gunspec_firearm_offers', { id: 'ak-47', region: 'AU' })) as Array<{ href: string | null }>;
    expect(offers[0]!.href).toBe('https://api.gunspec.io/v1/out/clk_1');
    expect(offers[1]!.href).toBeNull();
  });

  /* The docs tools answer from /v1/docs and pass the API's answer through
     untouched: whatever an agent reads is what the reference serves. */
  it('asks /v1/docs for an operation, a sample and the limits', async () => {
    const { client, lastUrl } = stubClient();
    const operation = await executeTool(client, 'gunspec_api_operation', { path: '/v1/firearms/{id}', method: 'GET' });
    expect(lastUrl()).toBe('https://api.gunspec.io/v1/docs/operations?path=%2Fv1%2Ffirearms%2F%7Bid%7D&method=GET');
    expect(operation).toMatchObject({ id: 'x' });
    await executeTool(client, 'gunspec_code_sample', { path: '/v1/firearms', language: 'sdk-python' });
    expect(lastUrl()).toBe('https://api.gunspec.io/v1/docs/samples?path=%2Fv1%2Ffirearms&language=sdk-python');
    await executeTool(client, 'gunspec_plan_limits', {});
    expect(lastUrl()).toBe('https://api.gunspec.io/v1/docs/limits');
  });

  it('never advertises the docs tools as keyless', () => {
    for (const name of ['gunspec_api_operation', 'gunspec_code_sample', 'gunspec_plan_limits']) {
      expect(getTool(name)?.tier, name).toBe('explorer');
      expect(getTool(name)?.readOnly, name).toBe(true);
    }
  });

  it('throws UnknownToolError for a name not in the manifest', async () => {
    const { client } = stubClient();
    await expect(executeTool(client, 'gunspec_delete_everything', {})).rejects.toBeInstanceOf(UnknownToolError);
  });
});

describe('adapters', () => {
  it('toolsForTier hides what a plan cannot reach', () => {
    const explorer = toolsForTier('explorer').map((t) => t.name);
    expect(explorer).toContain('gunspec_list_firearms');
    expect(explorer).not.toContain('gunspec_get_firearm');
    expect(explorer).not.toContain('gunspec_firearm_attachments');
    expect(toolsForTier('enterprise')).toHaveLength(GUNSPEC_TOOLS.length);
  });

  it('renders Anthropic, OpenAI and MCP shapes from one definition', () => {
    const [a] = asAnthropicTools([getTool('gunspec_search_firearms')!]);
    expect(a).toMatchObject({ name: 'gunspec_search_firearms', input_schema: { type: 'object' } });
    const [o] = asOpenAITools([getTool('gunspec_search_firearms')!]);
    expect(o).toMatchObject({ type: 'function', function: { name: 'gunspec_search_firearms', parameters: { type: 'object' } } });
    const [m] = asMcpTools([getTool('gunspec_search_firearms')!]);
    expect(m).toMatchObject({ name: 'gunspec_search_firearms', annotations: { readOnlyHint: true, destructiveHint: false } });
    expect(JSON.parse(JSON.stringify(asMcpTools()))).toHaveLength(GUNSPEC_TOOLS.length);
  });
});

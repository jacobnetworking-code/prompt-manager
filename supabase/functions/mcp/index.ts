// Prompt Manager — MCP Core v2
// Auth: ChatGPT -> OAuth -> Supabase Auth -> user JWT -> PostgreSQL RLS.
// No service_role key. All personal operations use the authenticated user's client.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { withSupabase, withOAuthProtectedResource, fromSupabaseUrl } from 'npm:@supabase/server@1.5.3'
import { z } from 'npm:zod@^4.1.13'

const SUPABASE_URL = 'https://jqrqsztmcfqfnnzyfjge.supabase.co'
const RESOURCE_SERVER = 'https://jqrqsztmcfqfnnzyfjge.supabase.co/functions/v1/mcp'
const PROMPT_COLUMNS = 'id,title,content,source,category_id,platforms,models,use_count,last_used_at,rating,acquisition_type,source_name,external_id,created_at,updated_at'
const CHAIN_COLUMNS = 'id,title,description,category_id,platform,model,rating,use_count,last_used_at,created_at,updated_at'
const STEP_COLUMNS = 'id,chain_id,position,title,content,prompt_id,created_at,updated_at'

const textResult = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] })
const errorResult = (message: string) => ({ isError: true, content: [{ type: 'text' as const, text: message }] })
const normalizePlatforms = (v?: string[]) => {
  if (!v?.length) return ['general']
  const out = [...new Set(v.map(x => x.trim().toLowerCase()).filter(Boolean))]
  return out.length ? out : ['general']
}
const safeSearch = (q: string) => q.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_').replaceAll(',', '\\,')
const StepSchema = z.object({
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1),
  prompt_id: z.string().uuid().nullable().optional(),
})
async function currentUserId(supabase: any) {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user.id as string
}
async function fetchChain(supabase: any, id: string) {
  const { data: chain, error } = await supabase.from('prompt_chains').select(CHAIN_COLUMNS).eq('id', id).maybeSingle()
  if (error) return { error: error.message }
  if (!chain) return { error: 'Chain not found or not accessible to the authenticated user.' }
  const { data: steps, error: stepError } = await supabase.from('prompt_chain_steps').select(STEP_COLUMNS).eq('chain_id', id).order('position', { ascending: true })
  if (stepError) return { error: stepError.message }
  return { chain: { ...chain, steps: steps ?? [] } }
}

function createMcpServer(supabase: any) {
  const server = new McpServer({ name: 'prompt-manager', version: '0.3.0' })

  server.registerTool('ping', {
    title: 'Prompt Manager Ping',
    description: 'Checks that the authenticated Prompt Manager MCP server is reachable.',
    inputSchema: { message: z.string().max(120).optional() },
  }, async ({ message }) => textResult(message ? `Prompt Manager MCP online: ${message}` : 'Prompt Manager MCP online'))

  server.registerTool('list_prompts', {
    title: 'List Prompts',
    description: 'Lists prompts from the authenticated user’s personal library, newest first.',
    inputSchema: { limit: z.number().int().min(1).max(50).optional() },
  }, async ({ limit }) => {
    const { data, error } = await supabase.from('prompts').select(PROMPT_COLUMNS).order('created_at', { ascending: false }).limit(limit ?? 20)
    return error ? errorResult(`Failed to list prompts: ${error.message}`) : textResult({ count: data?.length ?? 0, prompts: data ?? [] })
  })

  server.registerTool('search_prompts', {
    title: 'Search Prompts',
    description: 'Searches the authenticated user’s library by title or prompt content.',
    inputSchema: { query: z.string().trim().min(1).max(300), limit: z.number().int().min(1).max(50).optional() },
  }, async ({ query, limit }) => {
    const q = safeSearch(query)
    const { data, error } = await supabase.from('prompts').select(PROMPT_COLUMNS).or(`title.ilike.%${q}%,content.ilike.%${q}%`).order('created_at', { ascending: false }).limit(limit ?? 20)
    return error ? errorResult(`Failed to search prompts: ${error.message}`) : textResult({ query, count: data?.length ?? 0, prompts: data ?? [] })
  })

  server.registerTool('get_prompt', {
    title: 'Get Prompt',
    description: 'Retrieves one prompt by UUID.',
    inputSchema: { id: z.string().uuid() },
  }, async ({ id }) => {
    const { data, error } = await supabase.from('prompts').select(PROMPT_COLUMNS).eq('id', id).maybeSingle()
    if (error) return errorResult(`Failed to retrieve prompt: ${error.message}`)
    return data ? textResult({ prompt: data }) : errorResult('Prompt not found or not accessible to the authenticated user.')
  })

  server.registerTool('save_prompt', {
    title: 'Save Prompt',
    description: 'Saves a new prompt into the authenticated user’s personal library.',
    inputSchema: {
      title: z.string().trim().min(1).max(300), content: z.string().trim().min(1),
      source: z.string().max(2000).optional(), category_id: z.string().trim().min(1).max(100).optional(),
      platforms: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
      models: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
      rating: z.number().int().min(1).max(5).nullable().optional(),
    },
  }, async ({ title, content, source, category_id, platforms, models, rating }) => {
    const userId = await currentUserId(supabase)
    if (!userId) return errorResult('Could not determine the authenticated user.')
    const row = { user_id: userId, title: title.trim(), content: content.trim(), source: source?.trim() ?? '', category_id: category_id?.trim() || 'general', platforms: normalizePlatforms(platforms), models: models ?? [], rating: rating ?? null, acquisition_type: 'manual', use_count: 0 }
    const { data, error } = await supabase.from('prompts').insert(row).select(PROMPT_COLUMNS).single()
    return error ? errorResult(`Failed to save prompt: ${error.message}`) : textResult({ success: true, prompt: data })
  })

  server.registerTool('update_prompt', {
    title: 'Update Prompt',
    description: 'Updates editable fields of an existing prompt.',
    inputSchema: {
      id: z.string().uuid(), title: z.string().trim().min(1).max(300).optional(), content: z.string().trim().min(1).optional(),
      source: z.string().max(2000).optional(), category_id: z.string().trim().min(1).max(100).optional(),
      platforms: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
      models: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
    },
  }, async ({ id, title, content, source, category_id, platforms, models }) => {
    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title.trim()
    if (content !== undefined) updates.content = content.trim()
    if (source !== undefined) updates.source = source.trim()
    if (category_id !== undefined) updates.category_id = category_id.trim()
    if (platforms !== undefined) updates.platforms = normalizePlatforms(platforms)
    if (models !== undefined) updates.models = models
    if (!Object.keys(updates).length) return errorResult('No editable fields were supplied.')
    const { data, error } = await supabase.from('prompts').update(updates).eq('id', id).select(PROMPT_COLUMNS).maybeSingle()
    if (error) return errorResult(`Failed to update prompt: ${error.message}`)
    return data ? textResult({ success: true, prompt: data }) : errorResult('Prompt not found or not accessible to the authenticated user.')
  })

  server.registerTool('delete_prompt', {
    title: 'Delete Prompt',
    description: 'Permanently deletes a prompt belonging to the authenticated user.',
    inputSchema: { id: z.string().uuid() },
  }, async ({ id }) => {
    const { data: existing, error: e } = await supabase.from('prompts').select('id,title').eq('id', id).maybeSingle()
    if (e) return errorResult(`Failed to verify prompt before deletion: ${e.message}`)
    if (!existing) return errorResult('Prompt not found or not accessible to the authenticated user.')
    const { error } = await supabase.from('prompts').delete().eq('id', id)
    return error ? errorResult(`Failed to delete prompt: ${error.message}`) : textResult({ success: true, deleted: existing })
  })

  server.registerTool('rate_prompt', {
    title: 'Rate Prompt',
    description: 'Sets or clears the authenticated user’s 1-to-5 star rating for a prompt.',
    inputSchema: { id: z.string().uuid(), rating: z.number().int().min(1).max(5).nullable() },
  }, async ({ id, rating }) => {
    const { data, error } = await supabase.from('prompts').update({ rating }).eq('id', id).select(PROMPT_COLUMNS).maybeSingle()
    if (error) return errorResult(`Failed to rate prompt: ${error.message}`)
    return data ? textResult({ success: true, prompt: data }) : errorResult('Prompt not found or not accessible to the authenticated user.')
  })

  server.registerTool('mark_prompt_used', {
    title: 'Mark Prompt Used',
    description: 'Atomically increments a prompt’s use count and records when it was used.',
    inputSchema: { id: z.string().uuid() },
  }, async ({ id }) => {
    const { data, error } = await supabase.rpc('mark_prompt_used', { p_prompt_id: id })
    if (error) return errorResult(`Failed to mark prompt used: ${error.message}`)
    return data ? textResult({ success: true, prompt: data }) : errorResult('Prompt not found or not accessible to the authenticated user.')
  })

  server.registerTool('list_categories', {
    title: 'List Categories',
    description: 'Lists category identifiers currently used by the authenticated user’s prompts and chains.',
    inputSchema: {},
  }, async () => {
    const [{ data: p, error: pe }, { data: c, error: ce }] = await Promise.all([
      supabase.from('prompts').select('category_id'),
      supabase.from('prompt_chains').select('category_id'),
    ])
    if (pe || ce) return errorResult(`Failed to list categories: ${pe?.message ?? ce?.message}`)
    const categories = [...new Set([...(p ?? []), ...(c ?? [])].map((x: any) => x.category_id).filter(Boolean))].sort()
    return textResult({ count: categories.length, categories })
  })

  server.registerTool('list_chains', {
    title: 'List Prompt Chains',
    description: 'Lists the authenticated user’s prompt chains, newest first.',
    inputSchema: { limit: z.number().int().min(1).max(50).optional() },
  }, async ({ limit }) => {
    const { data, error } = await supabase.from('prompt_chains').select(CHAIN_COLUMNS).order('created_at', { ascending: false }).limit(limit ?? 20)
    return error ? errorResult(`Failed to list chains: ${error.message}`) : textResult({ count: data?.length ?? 0, chains: data ?? [] })
  })

  server.registerTool('get_chain', {
    title: 'Get Prompt Chain',
    description: 'Retrieves one prompt chain and its ordered steps.',
    inputSchema: { id: z.string().uuid() },
  }, async ({ id }) => {
    const result = await fetchChain(supabase, id)
    return result.error ? errorResult(`Failed to retrieve chain: ${result.error}`) : textResult(result)
  })

  server.registerTool('save_chain', {
    title: 'Save Prompt Chain',
    description: 'Creates a prompt chain with ordered steps in the authenticated user’s library.',
    inputSchema: {
      title: z.string().trim().min(1).max(100), description: z.string().max(300).optional(),
      category_id: z.string().trim().min(1).max(100).optional(), platform: z.string().trim().min(1).max(100).optional(),
      model: z.string().trim().min(1).max(100).nullable().optional(), rating: z.number().int().min(1).max(5).nullable().optional(),
      steps: z.array(StepSchema).min(1).max(50),
    },
  }, async ({ title, description, category_id, platform, model, rating, steps }) => {
    const userId = await currentUserId(supabase)
    if (!userId) return errorResult('Could not determine the authenticated user.')
    const { data: chain, error } = await supabase.from('prompt_chains').insert({
      user_id: userId, title: title.trim(), description: description?.trim() ?? '', category_id: category_id?.trim() || 'general',
      platform: platform?.trim() || 'general', model: model?.trim() || null, rating: rating ?? null,
    }).select(CHAIN_COLUMNS).single()
    if (error) return errorResult(`Failed to save chain: ${error.message}`)
    const rows = steps.map((s, i) => ({ chain_id: chain.id, user_id: userId, position: i + 1, title: s.title.trim(), content: s.content.trim(), prompt_id: s.prompt_id ?? null }))
    const { error: stepError } = await supabase.from('prompt_chain_steps').insert(rows)
    if (stepError) {
      await supabase.from('prompt_chains').delete().eq('id', chain.id)
      return errorResult(`Failed to save chain steps; chain creation was rolled back: ${stepError.message}`)
    }
    const result = await fetchChain(supabase, chain.id)
    return result.error ? errorResult(result.error) : textResult({ success: true, ...result })
  })

  server.registerTool('update_chain', {
    title: 'Update Prompt Chain',
    description: 'Updates chain metadata and optionally replaces its ordered steps.',
    inputSchema: {
      id: z.string().uuid(), title: z.string().trim().min(1).max(100).optional(), description: z.string().max(300).optional(),
      category_id: z.string().trim().min(1).max(100).optional(), platform: z.string().trim().min(1).max(100).optional(),
      model: z.string().trim().min(1).max(100).nullable().optional(), steps: z.array(StepSchema).min(1).max(50).optional(),
    },
  }, async ({ id, title, description, category_id, platform, model, steps }) => {
    const userId = await currentUserId(supabase)
    if (!userId) return errorResult('Could not determine the authenticated user.')
    const before = await fetchChain(supabase, id)
    if (before.error) return errorResult(before.error)
    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title.trim()
    if (description !== undefined) updates.description = description.trim()
    if (category_id !== undefined) updates.category_id = category_id.trim()
    if (platform !== undefined) updates.platform = platform.trim()
    if (model !== undefined) updates.model = model?.trim() || null
    if (Object.keys(updates).length) {
      const { error } = await supabase.from('prompt_chains').update(updates).eq('id', id)
      if (error) return errorResult(`Failed to update chain: ${error.message}`)
    }
    if (steps !== undefined) {
      const { error: de } = await supabase.from('prompt_chain_steps').delete().eq('chain_id', id)
      if (de) return errorResult(`Failed to replace chain steps: ${de.message}`)
      const rows = steps.map((s, i) => ({ chain_id: id, user_id: userId, position: i + 1, title: s.title.trim(), content: s.content.trim(), prompt_id: s.prompt_id ?? null }))
      const { error: ie } = await supabase.from('prompt_chain_steps').insert(rows)
      if (ie) {
        const oldSteps = (before.chain as any).steps.map((s: any) => ({ chain_id: id, user_id: userId, position: s.position, title: s.title, content: s.content, prompt_id: s.prompt_id }))
        if (oldSteps.length) await supabase.from('prompt_chain_steps').insert(oldSteps)
        return errorResult(`Failed to replace chain steps; previous steps were restored: ${ie.message}`)
      }
    }
    if (!Object.keys(updates).length && steps === undefined) return errorResult('No editable fields were supplied.')
    const result = await fetchChain(supabase, id)
    return result.error ? errorResult(result.error) : textResult({ success: true, ...result })
  })

  server.registerTool('delete_chain', {
    title: 'Delete Prompt Chain',
    description: 'Permanently deletes a prompt chain and its steps.',
    inputSchema: { id: z.string().uuid() },
  }, async ({ id }) => {
    const { data: existing, error: e } = await supabase.from('prompt_chains').select('id,title').eq('id', id).maybeSingle()
    if (e) return errorResult(`Failed to verify chain before deletion: ${e.message}`)
    if (!existing) return errorResult('Chain not found or not accessible to the authenticated user.')
    const { error } = await supabase.from('prompt_chains').delete().eq('id', id)
    return error ? errorResult(`Failed to delete chain: ${error.message}`) : textResult({ success: true, deleted: existing })
  })

  server.registerTool('rate_chain', {
    title: 'Rate Prompt Chain',
    description: 'Sets or clears the authenticated user’s 1-to-5 star rating for a prompt chain.',
    inputSchema: { id: z.string().uuid(), rating: z.number().int().min(1).max(5).nullable() },
  }, async ({ id, rating }) => {
    const { data, error } = await supabase.from('prompt_chains').update({ rating }).eq('id', id).select(CHAIN_COLUMNS).maybeSingle()
    if (error) return errorResult(`Failed to rate chain: ${error.message}`)
    return data ? textResult({ success: true, chain: data }) : errorResult('Chain not found or not accessible to the authenticated user.')
  })

  server.registerTool('mark_chain_used', {
    title: 'Mark Prompt Chain Used',
    description: 'Atomically increments a chain’s use count and records when it was used.',
    inputSchema: { id: z.string().uuid() },
  }, async ({ id }) => {
    const { data, error } = await supabase.rpc('mark_chain_used', { p_chain_id: id })
    if (error) return errorResult(`Failed to mark chain used: ${error.message}`)
    return data ? textResult({ success: true, chain: data }) : errorResult('Chain not found or not accessible to the authenticated user.')
  })

  return server
}

const mcpHandler = withSupabase({ auth: 'user' }, async (req, ctx) => {
  const server = createMcpServer(ctx.supabase)
  const transport = new WebStandardStreamableHTTPServerTransport()
  await server.connect(transport)
  return transport.handleRequest(req)
})

Deno.serve(withOAuthProtectedResource({
  resourceServer: RESOURCE_SERVER,
  authorizationServer: fromSupabaseUrl(SUPABASE_URL),
}, mcpHandler))

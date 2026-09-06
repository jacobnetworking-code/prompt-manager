// Prompt Manager M1.6.3 Gate 1
// Minimal unauthenticated MCP endpoint for transport/deployment validation only.
// No database access. No user data. No write tools.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { Hono } from 'npm:hono@^4.9.7'
import { z } from 'npm:zod@^4.1.13'

const app = new Hono()

const server = new McpServer({
  name: 'prompt-manager',
  version: '0.1.0',
})

server.registerTool(
  'ping',
  {
    title: 'Prompt Manager Ping',
    description: 'Checks that the Prompt Manager MCP server is reachable.',
    inputSchema: {
      message: z.string().max(120).optional(),
    },
  },
  ({ message }) => ({
    content: [
      {
        type: 'text',
        text: message ? `Prompt Manager MCP online: ${message}` : 'Prompt Manager MCP online',
      },
    ],
  }),
)

app.all('*', async (c) => {
  const transport = new WebStandardStreamableHTTPServerTransport()
  await server.connect(transport)
  return transport.handleRequest(c.req.raw)
})

Deno.serve(app.fetch)

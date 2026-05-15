import { createRequire } from "node:module";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { PaperclipClient } from "./client.js";
import { TOOLS } from "./tools/index.js";
import { handleCallTool } from "./handler.js";

// B1: version from package.json, not hardcoded
const _require = createRequire(import.meta.url);
const { version: serverVersion } = (_require("../package.json")) as { version: string };

const apiBase = process.env["PAPERCLIP_API_BASE"] ?? "http://127.0.0.1:3100";
const defaultCompanyId = process.env["PAPERCLIP_COMPANY_ID"];
const agentApiKey = process.env["PAPERCLIP_AGENT_API_KEY"];

const client = new PaperclipClient({ apiBase, defaultCompanyId, agentApiKey });

// B3: lazy health — re-checked after HEALTH_TTL_MS or when invalidated on 5xx
const HEALTH_TTL_MS = 30_000;
let healthyCached = false;
let lastHealthAt = 0;

async function refreshHealth(): Promise<boolean> {
  healthyCached = await client.healthCheck();
  lastHealthAt = Date.now();
  return healthyCached;
}

function invalidateHealth(): void {
  lastHealthAt = 0;
}

async function getHealth(): Promise<boolean> {
  if (Date.now() - lastHealthAt > HEALTH_TTL_MS) {
    return refreshHealth();
  }
  return healthyCached;
}

const server = new Server(
  { name: "paperclip-mcp-server", version: serverVersion },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema) as Record<string, unknown>,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) =>
  handleCallTool(req.params.name, req.params.arguments, client, getHealth, invalidateHealth),
);

// B2: health check runs before server.connect(transport)
await refreshHealth();
const transport = new StdioServerTransport();
await server.connect(transport);

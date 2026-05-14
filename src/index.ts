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

const apiBase = process.env["PAPERCLIP_API_BASE"] ?? "http://127.0.0.1:3100";
const defaultCompanyId = process.env["PAPERCLIP_COMPANY_ID"];

const client = new PaperclipClient({ apiBase, defaultCompanyId });

let paperclipisHealthy = false;

const server = new Server(
  { name: "paperclip-mcp-server", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema, { target: "openApi3" }) as Record<string, unknown>,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) =>
  handleCallTool(req.params.name, req.params.arguments, client, paperclipisHealthy),
);

const transport = new StdioServerTransport();
await server.connect(transport);
paperclipisHealthy = await client.healthCheck();

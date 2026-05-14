import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { PaperclipClient } from "./client.js";
import { TOOLS } from "./tools/index.js";
import {
  PaperclipApiError,
  PaperclipUnreachableError,
  ToolInputError,
  toToolErrorPayload,
} from "./shared/errors.js";

const apiBase = process.env["PAPERCLIP_API_BASE"] ?? "http://127.0.0.1:3100";
const defaultCompanyId = process.env["PAPERCLIP_COMPANY_ID"];

const client = new PaperclipClient({ apiBase, defaultCompanyId });

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

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = TOOLS.find((t) => t.name === req.params.name);
  if (!tool) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            code: "tool_input_error",
            field: "name",
            constraint: `unknown tool '${req.params.name}'`,
            message: "tool not found",
          }),
        },
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = tool.inputSchema.parse(req.params.arguments ?? {});
  } catch (err) {
    const issue = (err as { issues?: Array<{ path: Array<string | number>; message: string }> }).issues?.[0];
    const payload = toToolErrorPayload(
      new ToolInputError(issue?.path.join(".") ?? "input", issue?.message ?? "invalid"),
    );
    return { isError: true, content: [{ type: "text", text: JSON.stringify(payload) }] };
  }

  try {
    const result = await tool.handler(parsed, { client });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (err) {
    if (
      err instanceof PaperclipApiError ||
      err instanceof PaperclipUnreachableError ||
      err instanceof ToolInputError
    ) {
      return { isError: true, content: [{ type: "text", text: JSON.stringify(toToolErrorPayload(err)) }] };
    }
    return {
      isError: true,
      content: [
        { type: "text", text: JSON.stringify({ code: "internal_error", message: (err as Error).message }) },
      ],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

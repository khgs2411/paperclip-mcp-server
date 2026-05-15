import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { requireAgentApiKey } from "../shared/agent-auth.js";

const inputSchema = z.object({});

export const inboxLiteTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_inbox_lite",
  description:
    "Returns a compact assignment list for the authenticated agent (replaces the broken inbox_summary tool). Requires PAPERCLIP_AGENT_API_KEY environment variable.",
  inputSchema,
  handler: async (_input, { client }) => {
    requireAgentApiKey();
    return client.request("GET", "/api/agents/me/inbox-lite");
  },
};

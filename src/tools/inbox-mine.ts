import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { requireAgentApiKey } from "../shared/agent-auth.js";

const inputSchema = z.object({
  status: z
    .enum(["todo", "in_progress", "in_review", "blocked"])
    .optional()
    .describe("Filter by issue status"),
});

export const inboxMineTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_inbox_mine",
  description:
    "Returns issues assigned to the authenticated agent. Requires PAPERCLIP_AGENT_API_KEY environment variable.",
  inputSchema,
  handler: async (input, { client }) => {
    requireAgentApiKey();
    const params = input.status ? `?status=${encodeURIComponent(input.status)}` : "";
    return client.request("GET", `/api/agents/me/inbox/mine${params}`);
  },
};

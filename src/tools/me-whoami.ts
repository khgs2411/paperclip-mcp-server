import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { requireAgentApiKey } from "../shared/agent-auth.js";

const inputSchema = z.object({});

export const meWhoamiTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_me_whoami",
  description:
    "Returns the identity of the agent whose PAPERCLIP_AGENT_API_KEY is set. Requires PAPERCLIP_AGENT_API_KEY environment variable.",
  inputSchema,
  handler: async (_input, { client }) => {
    requireAgentApiKey();
    return client.request("GET", "/api/agents/me");
  },
};

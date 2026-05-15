import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1),
  companyId: z.string().optional(),
});

export const agentInstructionsGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_instructions_get",
  description: "Get an agent's instructions bundle (AGENTS.md, HEARTBEAT.md, SOUL.md, TOOLS.md).",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request(
      "GET",
      `/api/agents/${encodeURIComponent(input.agentId)}/instructions-bundle?companyId=${encodeURIComponent(companyId)}`,
    );
  },
};

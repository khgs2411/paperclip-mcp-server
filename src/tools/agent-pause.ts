import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1),
  companyId: z.string().optional(),
});

export const agentPauseTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_pause",
  description: "Pause an agent, preventing it from picking up new work.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    await client.request(
      "POST",
      `/api/agents/${encodeURIComponent(input.agentId)}/pause?companyId=${encodeURIComponent(companyId)}`,
      {},
    );
    return { agentId: input.agentId, paused: true };
  },
};

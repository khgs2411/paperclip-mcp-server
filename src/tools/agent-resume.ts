import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1),
  companyId: z.string().optional(),
});

export const agentResumeTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_resume",
  description: "Resume a paused agent.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    await client.request(
      "POST",
      `/api/agents/${encodeURIComponent(input.agentId)}/resume?companyId=${encodeURIComponent(companyId)}`,
      {},
    );
    return { agentId: input.agentId, resumed: true };
  },
};

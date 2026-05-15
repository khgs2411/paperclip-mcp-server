import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1),
  companyId: z.string().optional(),
  issueId: z.string().optional(),
});

export const agentWakeupTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_wakeup",
  description: "Wake an agent, optionally scoped to a specific issue.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const body: Record<string, unknown> = {};
    if (input.issueId) body["issueId"] = input.issueId;
    await client.request(
      "POST",
      `/api/agents/${encodeURIComponent(input.agentId)}/wakeup?companyId=${encodeURIComponent(companyId)}`,
      body,
    );
    return { agentId: input.agentId, triggered: true };
  },
};

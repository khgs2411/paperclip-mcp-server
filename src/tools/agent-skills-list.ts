import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1),
  companyId: z.string().optional(),
});

export const agentSkillsListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_skills_list",
  description: "Get the skill snapshot for an agent. Returns the raw skill snapshot from the API.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request(
      "GET",
      `/api/agents/${encodeURIComponent(input.agentId)}/skills?companyId=${encodeURIComponent(companyId)}`,
    );
  },
};

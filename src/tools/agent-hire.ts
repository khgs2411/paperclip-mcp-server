import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
  name: z.string().min(1),
  role: z.string().min(1),
  catalogEntryId: z.string().optional(),
  desiredSkills: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

export const agentHireTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_hire",
  description: "Initiate a hire request for a new agent in a company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const { companyId: _ignored, ...body } = input;
    const raw = (await client.request(
      "POST",
      `/api/companies/${encodeURIComponent(companyId)}/agent-hires`,
      body,
    )) as Record<string, unknown>;

    return {
      id: raw["id"],
      name: raw["name"],
      status: raw["status"],
    };
  },
};

import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

export const agentListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_list",
  description: "List all agents in a company. Returns compact agent records.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/agents`,
    )) as Array<Record<string, unknown>>;

    return raw.map((a) => ({
      id: a["id"],
      name: a["name"],
      urlKey: a["urlKey"],
      role: a["role"],
      status: a["status"],
    }));
  },
};

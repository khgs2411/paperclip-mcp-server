import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1),
  companyId: z.string().optional(),
});

export const agentGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_get",
  description: "Get a single agent by ID. Returns compact agent record.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/agents/${encodeURIComponent(input.agentId)}?companyId=${encodeURIComponent(companyId)}`,
    )) as Record<string, unknown>;

    return {
      id: raw["id"],
      name: raw["name"],
      urlKey: raw["urlKey"],
      role: raw["role"],
      title: raw["title"] ?? null,
      reportsTo: raw["reportsTo"] ?? null,
      capabilities: raw["capabilities"] ?? null,
      status: raw["status"],
    };
  },
};

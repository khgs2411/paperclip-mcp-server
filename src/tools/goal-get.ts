import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  goalId: z.string().min(1),
  companyId: z.string().optional(),
});

export const goalGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_goal_get",
  description: "Get a single goal by ID.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/goals/${encodeURIComponent(input.goalId)}?companyId=${encodeURIComponent(companyId)}`,
    )) as Record<string, unknown>;
    return { id: raw["id"], title: raw["title"], status: raw["status"], description: raw["description"] ?? null };
  },
};

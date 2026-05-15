import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  goalId: z.string().min(1),
  companyId: z.string().optional(),
});

interface GoalRaw {
  id: string;
  title: string;
  status: string;
  description?: string;
}

export const goalGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_goal_get",
  description: "Get a goal by id.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/goals/${encodeURIComponent(input.goalId)}?companyId=${encodeURIComponent(companyId)}`,
    )) as GoalRaw;
    return { id: raw.id, title: raw.title, status: raw.status, description: raw.description };
  },
};

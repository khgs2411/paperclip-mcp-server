import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  goalId: z.string().min(1),
  companyId: z.string().optional(),
  confirm: z.literal(true),
});

export const goalDeleteTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_goal_delete",
  description: "Delete a goal by id. Requires confirm: true.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    await client.request(
      "DELETE",
      `/api/goals/${encodeURIComponent(input.goalId)}?companyId=${encodeURIComponent(companyId)}`,
    );
    return { deleted: true, id: input.goalId };
  },
};

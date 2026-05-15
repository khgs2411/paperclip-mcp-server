import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z
  .object({
    goalId: z.string().min(1),
    companyId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
  })
  .refine((d) => d.title !== undefined || d.description !== undefined || d.status !== undefined, {
    message: "At least one of title, description, or status must be provided",
  });

interface GoalRaw {
  id: string;
  title: string;
  status: string;
}

export const goalPatchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_goal_patch",
  description: "Update a goal's title, description, or status.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const body: Record<string, unknown> = {};
    if (input.title !== undefined) body["title"] = input.title;
    if (input.description !== undefined) body["description"] = input.description;
    if (input.status !== undefined) body["status"] = input.status;
    const raw = (await client.request(
      "PATCH",
      `/api/goals/${encodeURIComponent(input.goalId)}?companyId=${encodeURIComponent(companyId)}`,
      body,
    )) as GoalRaw;
    return { id: raw.id, title: raw.title, status: raw.status };
  },
};

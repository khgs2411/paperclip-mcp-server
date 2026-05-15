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
  .refine((v) => v.title !== undefined || v.description !== undefined || v.status !== undefined, {
    message: "at least one of title, description, or status must be provided",
    path: ["_patch"],
  });

export const goalPatchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_goal_patch",
  description: "Update a goal's title, description, or status.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const { goalId, companyId: _ignored, ...body } = input;
    const raw = (await client.request(
      "PATCH",
      `/api/goals/${encodeURIComponent(goalId)}?companyId=${encodeURIComponent(companyId)}`,
      body,
    )) as Record<string, unknown>;
    return { id: raw["id"], title: raw["title"], status: raw["status"] };
  },
};

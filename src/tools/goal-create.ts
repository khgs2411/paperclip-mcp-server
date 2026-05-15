import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
});

interface GoalRaw {
  id: string;
  title: string;
  status: string;
}

export const goalCreateTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_goal_create",
  description: "Create a new goal for the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const body: Record<string, unknown> = { title: input.title };
    if (input.description !== undefined) body["description"] = input.description;
    if (input.status !== undefined) body["status"] = input.status;
    const raw = (await client.request(
      "POST",
      `/api/companies/${encodeURIComponent(companyId)}/goals`,
      body,
    )) as GoalRaw;
    return { id: raw.id, title: raw.title, status: raw.status };
  },
};

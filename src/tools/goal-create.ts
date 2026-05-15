import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
});

export const goalCreateTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_goal_create",
  description: "Create a new goal for the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const { companyId: _ignored, ...body } = input;
    const raw = (await client.request(
      "POST",
      `/api/companies/${encodeURIComponent(companyId)}/goals`,
      body,
    )) as Record<string, unknown>;
    return { id: raw["id"], title: raw["title"], status: raw["status"] };
  },
};

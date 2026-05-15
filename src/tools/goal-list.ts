import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

export const goalListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_goal_list",
  description: "List all goals for the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/goals`,
    )) as Array<Record<string, unknown>>;
    return raw.map((g) => ({ id: g["id"], title: g["title"], status: g["status"] }));
  },
};

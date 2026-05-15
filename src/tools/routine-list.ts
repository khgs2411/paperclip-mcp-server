import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

export const routineListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_routine_list",
  description: "List all routines for the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/routines`,
    )) as Array<Record<string, unknown>> | { routines: Array<Record<string, unknown>> };
    const items = Array.isArray(raw) ? raw : (raw.routines ?? []);
    return items.map((r) => ({ id: r["id"], name: r["name"], agentId: r["agentId"], status: r["status"] }));
  },
};

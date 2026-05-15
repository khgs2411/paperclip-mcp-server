import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  routineId: z.string().min(1),
  companyId: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const routineRunsListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_routine_runs_list",
  description: "List execution runs for a routine.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const qs = input.limit !== undefined ? `?companyId=${encodeURIComponent(companyId)}&limit=${input.limit}` : `?companyId=${encodeURIComponent(companyId)}`;
    return client.request(
      "GET",
      `/api/routines/${encodeURIComponent(input.routineId)}/runs${qs}`,
    );
  },
};

import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  routineId: z.string().min(1),
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
  limit: z.number().int().positive().optional(),
});

export const routineRunsListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_routine_runs_list",
  description: "Returns all runs for a given routine ID.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const limitPart = input.limit !== undefined ? `&limit=${input.limit}` : "";
    return client.request(
      "GET",
      `/api/routines/${encodeURIComponent(input.routineId)}/runs?companyId=${encodeURIComponent(companyId)}${limitPart}`,
    );
  },
};

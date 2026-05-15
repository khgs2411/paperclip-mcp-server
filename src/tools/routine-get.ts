import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  routineId: z.string().min(1),
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
});

export const routineGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_routine_get",
  description: "Returns the full routine response for a given routine ID.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request(
      "GET",
      `/api/routines/${encodeURIComponent(input.routineId)}?companyId=${encodeURIComponent(companyId)}`,
    );
  },
};

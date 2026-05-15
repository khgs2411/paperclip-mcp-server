import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
  limit: z.number().int().positive().max(100).optional(),
});

export const activityCompanyTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_activity_company",
  description: "Returns company-level activity feed. Defaults to limit=20, max 100.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const limit = input.limit ?? 20;
    return client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/activity?limit=${limit}`,
    );
  },
};

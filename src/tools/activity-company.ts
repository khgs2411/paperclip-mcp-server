import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const activityCompanyTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_activity_company",
  description: "Get recent company activity events. Default limit is 20, max 100.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/activity?limit=${input.limit ?? 20}`,
    );
  },
};

import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
});

export const dashboardGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_dashboard_get",
  description: "Returns the full company dashboard response.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request("GET", `/api/companies/${encodeURIComponent(companyId)}/dashboard`);
  },
};

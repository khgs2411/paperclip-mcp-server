import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
});

export const sidebarBadgesTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_sidebar_badges",
  description: "Returns sidebar badge counts for a company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request("GET", `/api/companies/${encodeURIComponent(companyId)}/sidebar-badges`);
  },
};

import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
  status: z
    .enum(["pending", "approved", "rejected", "revision_requested"])
    .optional()
    .describe("Filter by approval status"),
});

export const approvalListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_approval_list",
  description: "Lists approvals for the company, optionally filtered by status.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const params = input.status ? `?status=${encodeURIComponent(input.status)}` : "";
    return client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/approvals${params}`,
    );
  },
};

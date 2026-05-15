import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
});

export const inboxSummaryTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_inbox_summary",
  description:
    "Returns a single-read summary of pending work: pending approval count and total in-review issue count. " +
    "Note: pending interaction count is not included — no company-level interactions endpoint exists; use paperclip_issue_interactions_list per issue instead.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);

    const enc = encodeURIComponent(companyId);
    const [approvals, inReview] = await Promise.all([
      client.request<unknown[]>("GET", `/api/companies/${enc}/approvals?status=pending`),
      client.request<unknown[]>("GET", `/api/companies/${enc}/issues?status=in_review`),
    ]);

    return {
      pendingApprovals: approvals.length,
      totalInReview: inReview.length,
    };
  },
};

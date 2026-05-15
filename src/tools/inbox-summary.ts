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
    "Returns a single-read summary of pending work: interaction count, pending approval count, and unassigned in-review issues.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);

    const enc = encodeURIComponent(companyId);
    const [interactions, approvals, unassignedInReview] = await Promise.all([
      client.request<unknown[]>("GET", `/api/companies/${enc}/interactions?status=pending`),
      client.request<unknown[]>("GET", `/api/companies/${enc}/approvals?status=pending`),
      client.request<unknown[]>("GET", `/api/companies/${enc}/issues?status=in_review`),
    ]);

    return {
      pendingInteractions: interactions.length,
      pendingApprovals: approvals.length,
      unassignedInReview: unassignedInReview.length,
    };
  },
};

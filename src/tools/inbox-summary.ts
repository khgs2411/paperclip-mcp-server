import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe(
      "Company ID — required when PAPERCLIP_AGENT_API_KEY is not set. Defaults to PAPERCLIP_COMPANY_ID env var.",
    ),
});

export const inboxSummaryTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_inbox_summary",
  description:
    "Returns a summary of pending work. With PAPERCLIP_AGENT_API_KEY set: calls /agents/me/inbox-lite for the caller's agent inbox (companyId not needed). Without it: returns company-wide pending approvals and unassigned in-review count (companyId required).",
  inputSchema,
  handler: async (input, { client }) => {
    if (client.agentApiKey) {
      // Agent-key path: agent-scoped compact inbox
      return client.request("GET", "/api/agents/me/inbox-lite");
    }

    // No agent key: aggregate company-wide metrics
    const companyId = client.resolveCompanyId(input.companyId);
    const enc = encodeURIComponent(companyId);
    const [approvals, unassignedInReview] = await Promise.all([
      client.request<unknown[]>("GET", `/api/companies/${enc}/approvals?status=pending`),
      client.request<unknown[]>("GET", `/api/companies/${enc}/issues?status=in_review`),
    ]);

    return {
      pendingApprovals: approvals.length,
      unassignedInReview: unassignedInReview.length,
    };
  },
};

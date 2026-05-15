import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional().describe("Company UUID (falls back to PAPERCLIP_COMPANY_ID)"),
  status: z.string().optional().describe("Comma-separated statuses to filter"),
  assigneeAgentId: z.string().optional().describe("Filter by assignee agent UUID"),
  projectId: z.string().optional().describe("Filter by project UUID"),
});

export const issueCountTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_count",
  description: "Return the count of issues matching the given filters.",
  inputSchema,
  handler: async (input, { client }) => {
    const cid = client.resolveCompanyId(input.companyId);
    const params = new URLSearchParams();
    if (input.status) params.set("status", input.status);
    if (input.assigneeAgentId) params.set("assigneeAgentId", input.assigneeAgentId);
    if (input.projectId) params.set("projectId", input.projectId);
    const qs = params.toString();
    const path = `/api/companies/${encodeURIComponent(cid)}/issues/count${qs ? `?${qs}` : ""}`;
    return client.request("GET", path);
  },
};

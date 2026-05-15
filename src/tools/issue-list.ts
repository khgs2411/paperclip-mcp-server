import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional().describe("Company UUID (falls back to PAPERCLIP_COMPANY_ID)"),
  status: z.string().optional().describe("Comma-separated statuses to filter (e.g. todo,in_progress)"),
  assigneeAgentId: z.string().optional().describe("Filter by assignee agent UUID"),
  projectId: z.string().optional().describe("Filter by project UUID"),
  parentId: z.string().optional().describe("Filter by parent issue UUID"),
  q: z.string().optional().describe("Full-text search query"),
  limit: z.number().int().positive().optional().describe("Max results to return"),
});

export const issueListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_list",
  description:
    "List issues for the company. Supports filtering by status, assignee, project, and parent. " +
    "Returns compact issue records.",
  inputSchema,
  handler: async (input, { client }) => {
    const cid = client.resolveCompanyId(input.companyId);
    const params = new URLSearchParams();
    if (input.status) params.set("status", input.status);
    if (input.assigneeAgentId) params.set("assigneeAgentId", input.assigneeAgentId);
    if (input.projectId) params.set("projectId", input.projectId);
    if (input.parentId) params.set("parentId", input.parentId);
    if (input.q) params.set("q", input.q);
    if (input.limit) params.set("limit", String(input.limit));
    const qs = params.toString();
    const path = `/api/companies/${encodeURIComponent(cid)}/issues${qs ? `?${qs}` : ""}`;
    return client.request("GET", path);
  },
};

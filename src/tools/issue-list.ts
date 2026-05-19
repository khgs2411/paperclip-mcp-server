import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { ToolInputError } from "../shared/errors.js";

const ISSUE_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
  "cancelled",
] as const;

const ISSUE_STATUS_SET = new Set<string>(ISSUE_STATUSES);

const inputSchema = z.object({
  companyId: z.string().optional().describe("Company UUID (falls back to PAPERCLIP_COMPANY_ID)"),
  status: z
    .string()
    .optional()
    .describe("Comma-separated statuses to filter: backlog,todo,in_progress,in_review,done,blocked,cancelled"),
  assigneeAgentId: z.string().optional().describe("Filter by assignee agent UUID"),
  projectId: z.string().optional().describe("Filter by project UUID"),
  parentId: z.string().optional().describe("Filter by parent issue UUID"),
  q: z.string().optional().describe("Full-text search query"),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Max results to return; applies per status when filtering by multiple statuses"),
});

export const issueListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_list",
  description:
    "List issues for the company. Supports filtering by status, assignee, project, and parent. " +
    "Returns compact issue records.",
  inputSchema,
  handler: async (input, { client }) => {
    const cid = client.resolveCompanyId(input.companyId);
    const statuses = parseStatuses(input.status);
    if (statuses.length <= 1) {
      return client.request("GET", buildIssueListPath(cid, input, statuses[0]));
    }

    const issueSets = await Promise.all(
      statuses.map((status) => client.request<unknown[]>("GET", buildIssueListPath(cid, input, status))),
    );
    return issueSets.flat();
  },
};

function parseStatuses(status: string | undefined): string[] {
  if (!status) return [];

  const statuses = status.split(",").map((value) => value.trim());
  if (statuses.some((value) => value.length === 0)) {
    throw new ToolInputError("status", `must be one or more of ${ISSUE_STATUSES.join(",")}`);
  }

  const invalid = statuses.find((value) => !ISSUE_STATUS_SET.has(value));
  if (invalid) {
    throw new ToolInputError("status", `unsupported value "${invalid}"; expected one of ${ISSUE_STATUSES.join(",")}`);
  }

  return [...new Set(statuses)];
}

function buildIssueListPath(
  cid: string,
  input: z.infer<typeof inputSchema>,
  status: string | undefined,
): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (input.assigneeAgentId) params.set("assigneeAgentId", input.assigneeAgentId);
  if (input.projectId) params.set("projectId", input.projectId);
  if (input.parentId) params.set("parentId", input.parentId);
  if (input.q) params.set("q", input.q);
  if (input.limit) params.set("limit", String(input.limit));
  const qs = params.toString();
  return `/api/companies/${encodeURIComponent(cid)}/issues${qs ? `?${qs}` : ""}`;
}

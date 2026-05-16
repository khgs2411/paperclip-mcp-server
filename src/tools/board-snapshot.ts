import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company UUID (falls back to PAPERCLIP_COMPANY_ID env var)."),
  issueLimit: z
    .number()
    .int()
    .positive()
    .max(500)
    .optional()
    .describe(
      "Max issues per status group (todo/in_progress/in_review/blocked). Default 50.",
    ),
  agentLimit: z
    .number()
    .int()
    .positive()
    .max(500)
    .optional()
    .describe("Max agents returned. Default 50."),
});

type Issue = Record<string, unknown> & { status?: string };
type Approval = Record<string, unknown> & {
  id?: string;
  title?: string;
  type?: string;
  createdAt?: string;
};

const ACTIVE_STATUSES = ["todo", "in_progress", "in_review", "blocked"] as const;
type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

export const boardSnapshotTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_board_snapshot",
  description:
    "One-call board snapshot for status reads and BRIEF.md reconciliation. Returns active issues grouped by status, pending approvals (compact), projects, and agents — all in parallel. Use this instead of assembling inbox-summary + issue-list + project-list + agent-list manually for routine status reports.",
  inputSchema,
  handler: async (input, { client }) => {
    const cid = client.resolveCompanyId(input.companyId);
    const enc = encodeURIComponent(cid);
    const issueLimit = input.issueLimit ?? 50;
    const agentLimit = input.agentLimit ?? 50;

    const issueQs = `?status=${ACTIVE_STATUSES.join(",")}&limit=${issueLimit * ACTIVE_STATUSES.length}`;

    const [issuesRaw, approvalsRaw, projectsRaw, agentsRaw] = await Promise.all([
      client.request<Issue[]>("GET", `/api/companies/${enc}/issues${issueQs}`),
      client.request<Approval[]>(
        "GET",
        `/api/companies/${enc}/approvals?status=pending`,
      ),
      client.request<unknown[]>("GET", `/api/companies/${enc}/projects`),
      client.request<unknown[]>(
        "GET",
        `/api/companies/${enc}/agents?limit=${agentLimit}`,
      ),
    ]);

    const issuesByStatus: Record<ActiveStatus, Issue[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      blocked: [],
    };
    let issueCap = false;
    for (const issue of issuesRaw) {
      const status = issue.status as ActiveStatus | undefined;
      if (!status || !ACTIVE_STATUSES.includes(status)) continue;
      const bucket = issuesByStatus[status];
      if (bucket.length < issueLimit) {
        bucket.push(issue);
      } else {
        issueCap = true;
      }
    }

    const pendingApprovals = approvalsRaw.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      createdAt: a.createdAt,
    }));

    return {
      generatedAt: new Date().toISOString(),
      companyId: cid,
      issues: {
        todo: issuesByStatus.todo,
        in_progress: issuesByStatus.in_progress,
        in_review: issuesByStatus.in_review,
        blocked: issuesByStatus.blocked,
        counts: {
          todo: issuesByStatus.todo.length,
          in_progress: issuesByStatus.in_progress.length,
          in_review: issuesByStatus.in_review.length,
          blocked: issuesByStatus.blocked.length,
          totalActive:
            issuesByStatus.todo.length +
            issuesByStatus.in_progress.length +
            issuesByStatus.in_review.length +
            issuesByStatus.blocked.length,
        },
      },
      approvals: {
        pendingCount: pendingApprovals.length,
        pending: pendingApprovals,
      },
      projects: projectsRaw,
      agents: agentsRaw,
      meta: {
        issueLimitPerStatus: issueLimit,
        agentLimit,
        capped: {
          issues: issueCap,
          agents: agentsRaw.length >= agentLimit,
        },
      },
    };
  },
};

import { z } from "zod";
import type { ToolDefinition } from "./index.js";

type ActivityEvent = {
  action?: string;
  agentId?: string | null;
  runId?: string | null;
  createdAt?: string | Date | null;
  details?: {
    identifier?: string;
    title?: string;
    issueTitle?: string;
  };
};

const inputSchema = z.object({
  companyId: z.string().optional().describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
  limit: z.number().int().positive().max(500).optional().describe("Maximum activity rows to summarize. Defaults to 200, max 500."),
  since: z.string().datetime({ offset: true }).optional().describe("Inclusive lower createdAt bound for the requested activity window."),
});

export const activitySummaryTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_activity_summary",
  description:
    "Summarizes recent company activity by issue, agent, and run to diagnose control-plane churn and token burn.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const params = new URLSearchParams({ limit: String(input.limit ?? 200) });
    if (input.since) params.set("since", input.since);
    const events = await client.request<ActivityEvent[]>(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/activity?${params.toString()}`,
    );

    const issues = new Map<string, { identifier: string; title: string; events: number; comments: number; creates: number; updates: number; blockers: number }>();
    const agents = new Map<string, { agentId: string; events: number; runs: Set<string>; comments: number; creates: number; leases: number }>();
    const runs = new Map<string, { runId: string; agentId: string | null; events: number; firstSeenAt: string | null; lastSeenAt: string | null; issues: Set<string> }>();

    for (const event of events) {
      const identifier = event.details?.identifier;
      if (identifier) {
        const issue = issues.get(identifier) ?? {
          identifier,
          title: event.details?.issueTitle ?? event.details?.title ?? "",
          events: 0,
          comments: 0,
          creates: 0,
          updates: 0,
          blockers: 0,
        };
        issue.events += 1;
        if (event.action === "issue.comment_added") issue.comments += 1;
        if (event.action === "issue.created") issue.creates += 1;
        if (event.action === "issue.updated") issue.updates += 1;
        if (event.action === "issue.blockers_updated") issue.blockers += 1;
        if (!issue.title) issue.title = event.details?.issueTitle ?? event.details?.title ?? "";
        issues.set(identifier, issue);
      }

      if (event.agentId) {
        const agent = agents.get(event.agentId) ?? {
          agentId: event.agentId,
          events: 0,
          runs: new Set<string>(),
          comments: 0,
          creates: 0,
          leases: 0,
        };
        agent.events += 1;
        if (event.runId) agent.runs.add(event.runId);
        if (event.action === "issue.comment_added") agent.comments += 1;
        if (event.action === "issue.created") agent.creates += 1;
        if (event.action?.startsWith("environment.lease")) agent.leases += 1;
        agents.set(event.agentId, agent);
      }

      if (event.runId) {
        const run = runs.get(event.runId) ?? {
          runId: event.runId,
          agentId: event.agentId ?? null,
          events: 0,
          firstSeenAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
          lastSeenAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
          issues: new Set<string>(),
        };
        const createdAt = event.createdAt ? new Date(event.createdAt).toISOString() : null;
        run.events += 1;
        if (createdAt && (!run.firstSeenAt || createdAt < run.firstSeenAt)) run.firstSeenAt = createdAt;
        if (createdAt && (!run.lastSeenAt || createdAt > run.lastSeenAt)) run.lastSeenAt = createdAt;
        if (identifier) run.issues.add(identifier);
        runs.set(event.runId, run);
      }
    }

    return {
      meta: {
        requestedLimit: input.limit ?? 200,
        returnedCount: events.length,
        capped: events.length >= (input.limit ?? 200),
      },
      topIssues: [...issues.values()].sort((left, right) => right.events - left.events),
      agents: [...agents.values()]
        .map((agent) => ({ ...agent, runs: agent.runs.size }))
        .sort((left, right) => right.runs - left.runs),
      runs: [...runs.values()]
        .map((run) => ({ ...run, issues: [...run.issues].sort() }))
        .sort((left, right) => (left.firstSeenAt ?? "").localeCompare(right.firstSeenAt ?? "")),
    };
  },
};

import { z } from "zod";
import { ROUTINE_RUN_STATUSES } from "@paperclipai/shared";
import type { ToolDefinition } from "./index.js";

const NON_TERMINAL = new Set(["received", "issue_created"]);
const TERMINAL_STATUSES = new Set(
  (ROUTINE_RUN_STATUSES as readonly string[]).filter((s) => !NON_TERMINAL.has(s)),
);

const inputSchema = z.object({
  routineId: z.string().min(1),
  wait: z.boolean().default(false),
  timeoutSec: z.number().int().positive().default(60),
  pollIntervalMs: z.number().int().positive().default(1000),
});

interface RunResponse {
  id: string;
  status: string;
  linkedIssueId: string | null;
  failureReason: string | null;
  completedAt: string | null;
}

export const routineRunTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_routine_run",
  description:
    "Trigger a manual run of a routine. wait=false (default) returns immediately. wait=true polls until terminal status (completed/failed/coalesced/skipped) or timeoutSec elapses (synthesizes status='timed_out').",
  inputSchema,
  handler: async (input, { client }) => {
    const run = (await client.request(
      "POST",
      `/api/routines/${encodeURIComponent(input.routineId)}/run`,
      {},
    )) as RunResponse;

    if (!input.wait) {
      return {
        runId: run.id,
        status: run.status,
        linkedIssueId: run.linkedIssueId,
        completedAt: run.completedAt,
        failureReason: run.failureReason,
      };
    }

    const deadline = Date.now() + input.timeoutSec * 1000;
    let lastSeen = run;
    while (Date.now() < deadline) {
      const runs = (await client.request(
        "GET",
        `/api/routines/${encodeURIComponent(input.routineId)}/runs?limit=20`,
      )) as RunResponse[];
      const match = runs.find((r) => r.id === run.id);
      if (match) {
        lastSeen = match;
        if (TERMINAL_STATUSES.has(match.status)) {
          return {
            runId: match.id,
            status: match.status,
            linkedIssueId: match.linkedIssueId,
            completedAt: match.completedAt,
            failureReason: match.failureReason,
          };
        }
      }
      await new Promise((resolve) => setTimeout(resolve, input.pollIntervalMs));
    }
    return {
      runId: lastSeen.id,
      status: "timed_out",
      linkedIssueId: lastSeen.linkedIssueId,
      completedAt: lastSeen.completedAt,
      failureReason: lastSeen.failureReason,
    };
  },
};

import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { routineRunTool } from "../../src/tools/routine-run.js";
import { PaperclipClient } from "../../src/client.js";

describe("routine_run (fire-and-forget)", () => {
  beforeEach(() => mock.restore());

  it("POSTs /api/routines/:id/run and returns compact run info", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "RUN1",
      status: "issue_created",
      linkedIssueId: "I1",
      failureReason: null,
      completedAt: null,
    });
    const result = await routineRunTool.handler(
      { routineId: "R1", wait: false, timeoutSec: 60, pollIntervalMs: 1000 },
      { client },
    );
    expect(spy).toHaveBeenCalledWith("POST", "/api/routines/R1/run", {});
    expect(result).toEqual({
      runId: "RUN1",
      status: "issue_created",
      linkedIssueId: "I1",
      completedAt: null,
      failureReason: null,
    });
  });
});

describe("routine_run (wait=true)", () => {
  beforeEach(() => mock.restore());

  it("polls /api/routines/:id/runs and returns when run reaches terminal status", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    spyOn(client, "request")
      .mockResolvedValueOnce({
        id: "RUN1",
        status: "issue_created",
        linkedIssueId: "I1",
        failureReason: null,
        completedAt: null,
      })
      .mockResolvedValueOnce([
        { id: "RUN1", status: "issue_created", linkedIssueId: "I1", failureReason: null, completedAt: null },
      ])
      .mockResolvedValueOnce([
        { id: "RUN1", status: "completed", linkedIssueId: "I1", failureReason: null, completedAt: "2026-05-14T16:00:00Z" },
      ]);
    const result = await routineRunTool.handler(
      { routineId: "R1", wait: true, timeoutSec: 5, pollIntervalMs: 1 },
      { client },
    );
    expect(result).toEqual({
      runId: "RUN1",
      status: "completed",
      linkedIssueId: "I1",
      completedAt: "2026-05-14T16:00:00Z",
      failureReason: null,
    });
  });

  it("synthesizes status='timed_out' when terminal status is not reached in time", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    spyOn(client, "request")
      .mockResolvedValueOnce({
        id: "RUN2",
        status: "issue_created",
        linkedIssueId: null,
        failureReason: null,
        completedAt: null,
      })
      .mockResolvedValue([
        { id: "RUN2", status: "issue_created", linkedIssueId: null, failureReason: null, completedAt: null },
      ]);
    const result = await routineRunTool.handler(
      { routineId: "R2", wait: true, timeoutSec: 1, pollIntervalMs: 1 },
      { client },
    );
    expect((result as { status: string }).status).toBe("timed_out");
  });
});

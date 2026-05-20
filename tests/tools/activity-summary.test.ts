import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { activitySummaryTool } from "../../src/tools/activity-summary.js";
import { PaperclipClient } from "../../src/client.js";

describe("activity_summary", () => {
  beforeEach(() => mock.restore());

  it("summarizes issue, agent, and run activity from the company activity feed", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([
      {
        action: "issue.comment_added",
        agentId: "A1",
        runId: "R1",
        createdAt: "2026-05-20T10:00:00.000Z",
        details: { identifier: "TOP-1", issueTitle: "Parent" },
      },
      {
        action: "issue.created",
        agentId: "A1",
        runId: "R1",
        createdAt: "2026-05-20T10:01:00.000Z",
        details: { identifier: "TOP-2", title: "Audit child" },
      },
      {
        action: "environment.lease_acquired",
        agentId: "A2",
        runId: "R2",
        createdAt: "2026-05-20T10:02:00.000Z",
        details: { issueId: "I2" },
      },
    ]);

    const result = await activitySummaryTool.handler({ limit: 50 }, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/activity?limit=50");
    expect(result).toMatchObject({
      meta: { returnedCount: 3, capped: false },
      topIssues: [
        { identifier: "TOP-1", events: 1, comments: 1, creates: 0, title: "Parent" },
        { identifier: "TOP-2", events: 1, comments: 0, creates: 1, title: "Audit child" },
      ],
      agents: [
        { agentId: "A1", events: 2, runs: 1, comments: 1, creates: 1 },
        { agentId: "A2", events: 1, runs: 1, comments: 0, creates: 0 },
      ],
      runs: [
        { runId: "R1", agentId: "A1", events: 2, issues: ["TOP-1", "TOP-2"] },
        { runId: "R2", agentId: "A2", events: 1, issues: [] },
      ],
    });
  });
});

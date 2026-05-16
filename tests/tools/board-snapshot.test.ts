import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { boardSnapshotTool } from "../../src/tools/board-snapshot.js";
import { PaperclipClient } from "../../src/client.js";
import { PaperclipApiError, ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_board_snapshot", () => {
  beforeEach(() => mock.restore());

  it("returns issues grouped by active status, approvals, projects, and agents", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      defaultCompanyId: "cid1",
    });

    const issues = [
      { id: "i1", status: "todo", title: "A" },
      { id: "i2", status: "in_progress", title: "B" },
      { id: "i3", status: "in_progress", title: "C" },
      { id: "i4", status: "in_review", title: "D" },
      { id: "i5", status: "blocked", title: "E" },
      { id: "i6", status: "done", title: "F" }, // should be filtered out
    ];
    const approvals = [
      { id: "a1", title: "Approve hire", type: "hire", createdAt: "2026-05-16T00:00:00Z" },
    ];
    const projects = [{ id: "p1", name: "Trygga" }];
    const agents = [{ id: "ag1", name: "Atlas" }];

    const spy = spyOn(client, "request")
      .mockResolvedValueOnce(issues)
      .mockResolvedValueOnce(approvals)
      .mockResolvedValueOnce(projects)
      .mockResolvedValueOnce(agents);

    const result = (await boardSnapshotTool.handler(
      { companyId: "cid1" },
      { client },
    )) as {
      issues: {
        todo: unknown[];
        in_progress: unknown[];
        in_review: unknown[];
        blocked: unknown[];
        counts: Record<string, number>;
      };
      approvals: { pendingCount: number; pending: unknown[] };
      projects: unknown[];
      agents: unknown[];
      meta: { capped: { issues: boolean; agents: boolean } };
      companyId: string;
    };

    expect(spy).toHaveBeenCalledTimes(4);
    expect(result.companyId).toBe("cid1");
    expect(result.issues.counts).toEqual({
      todo: 1,
      in_progress: 2,
      in_review: 1,
      blocked: 1,
      totalActive: 5,
    });
    expect(result.issues.todo).toHaveLength(1);
    expect(result.issues.in_progress).toHaveLength(2);
    expect(result.approvals.pendingCount).toBe(1);
    expect(result.approvals.pending[0]).toEqual({
      id: "a1",
      title: "Approve hire",
      type: "hire",
      createdAt: "2026-05-16T00:00:00Z",
    });
    expect(result.projects).toEqual(projects);
    expect(result.agents).toEqual(agents);
    expect(result.meta.capped.issues).toBe(false);
    expect(result.meta.capped.agents).toBe(false);
  });

  it("uses defaultCompanyId from client when companyId omitted", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      defaultCompanyId: "auto-cid",
    });
    spyOn(client, "request")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = (await boardSnapshotTool.handler({}, { client })) as {
      companyId: string;
    };
    expect(result.companyId).toBe("auto-cid");
  });

  it("caps issues per status group when limit is reached", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      defaultCompanyId: "cid1",
    });
    const issues = [
      { id: "i1", status: "todo" },
      { id: "i2", status: "todo" },
      { id: "i3", status: "todo" },
    ];
    spyOn(client, "request")
      .mockResolvedValueOnce(issues)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = (await boardSnapshotTool.handler(
      { companyId: "cid1", issueLimit: 2 },
      { client },
    )) as {
      issues: { todo: unknown[] };
      meta: { capped: { issues: boolean } };
    };
    expect(result.issues.todo).toHaveLength(2);
    expect(result.meta.capped.issues).toBe(true);
  });

  it("throws ToolInputError when no companyId is available", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(
      boardSnapshotTool.handler({}, { client }),
    ).rejects.toBeInstanceOf(ToolInputError);
  });

  it("propagates API errors", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      defaultCompanyId: "cid1",
    });
    spyOn(client, "request").mockRejectedValueOnce(
      new PaperclipApiError(500, { error: "internal" }, "/api/companies/cid1/issues"),
    );
    await expect(
      boardSnapshotTool.handler({ companyId: "cid1" }, { client }),
    ).rejects.toBeInstanceOf(PaperclipApiError);
  });
});

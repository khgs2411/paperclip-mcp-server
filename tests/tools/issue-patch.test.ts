import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issuePatchTool } from "../../src/tools/issue-patch.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_patch", () => {
  beforeEach(() => mock.restore());

  it("PATCHes /api/issues/:id accepting TOP-N identifier", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "U1",
      identifier: "TOP-16",
      status: "in_progress",
      priority: "high",
      title: "Board Channel",
      assigneeAgentId: "A1",
      assigneeUserId: null,
      checkoutRunId: null,
      executionRunId: null,
    });
    const result = await issuePatchTool.handler(
      { issueIdOrIdentifier: "TOP-16", status: "in_progress", priority: "high" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/issues/TOP-16", {
      status: "in_progress",
      priority: "high",
    });
    expect(result).toEqual({
      id: "U1",
      identifier: "TOP-16",
      status: "in_progress",
      priority: "high",
      title: "Board Channel",
      assigneeAgentId: "A1",
      assigneeUserId: null,
      checkoutRunId: null,
      executionRunId: null,
      interruptedRunId: undefined,
      cancelledStatusRunId: undefined,
    });
  });

  it("passes interrupt with a required comment for active run control", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "U5",
      identifier: "TOP-403",
      status: "in_progress",
      priority: "medium",
      title: "Manager attention reliability test",
      assigneeAgentId: "A1",
      assigneeUserId: null,
      checkoutRunId: null,
      executionRunId: null,
      interruptedRunId: "RUN-1",
    });

    const result = await issuePatchTool.handler(
      {
        issueIdOrIdentifier: "TOP-403",
        comment: "Interrupting the active run before closing the smoke test.",
        interrupt: true,
      },
      { client },
    );

    expect(spy).toHaveBeenCalledWith("PATCH", "/api/issues/TOP-403", {
      comment: "Interrupting the active run before closing the smoke test.",
      interrupt: true,
    });
    expect(result).toMatchObject({ interruptedRunId: "RUN-1" });
  });

  it("rejects interrupt without a comment", async () => {
    await expect(
      issuePatchTool.inputSchema.parseAsync({ issueIdOrIdentifier: "TOP-403", interrupt: true }),
    ).rejects.toThrow("interrupt requires a non-empty comment");
  });

  it("clears user assignee by passing assigneeUserId: null", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "U2",
      identifier: "TOP-20",
      status: "todo",
      priority: "medium",
      title: "Some Task",
      assigneeAgentId: null,
      assigneeUserId: null,
    });
    const result = await issuePatchTool.handler(
      { issueIdOrIdentifier: "TOP-20", assigneeUserId: null },
      { client },
    );
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/issues/TOP-20", { assigneeUserId: null });
    expect(result).toMatchObject({ assigneeUserId: null });
  });

  it("assigns an agent by setting assigneeAgentId", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const agentId = "02ec6f28-bfac-4504-9b21-6323c8855096";
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "U3",
      identifier: "TOP-21",
      status: "in_progress",
      priority: "high",
      title: "Agent Task",
      assigneeAgentId: agentId,
      assigneeUserId: null,
    });
    const result = await issuePatchTool.handler(
      { issueIdOrIdentifier: "TOP-21", assigneeAgentId: agentId },
      { client },
    );
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/issues/TOP-21", { assigneeAgentId: agentId });
    expect(result).toMatchObject({ assigneeAgentId: agentId, assigneeUserId: null });
  });

  it("clears user assignee and assigns agent in one patch", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const agentId = "02ec6f28-bfac-4504-9b21-6323c8855096";
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "U4",
      identifier: "TOP-127",
      status: "in_review",
      priority: "high",
      title: "Transfer Task",
      assigneeAgentId: agentId,
      assigneeUserId: null,
    });
    const result = await issuePatchTool.handler(
      {
        issueIdOrIdentifier: "TOP-127",
        assigneeUserId: null,
        assigneeAgentId: agentId,
        status: "in_review",
      },
      { client },
    );
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/issues/TOP-127", {
      assigneeUserId: null,
      assigneeAgentId: agentId,
      status: "in_review",
    });
    expect(result).toMatchObject({ assigneeAgentId: agentId, assigneeUserId: null });
  });

  it("surfaces API validation errors (one-assignee constraint)", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    spyOn(client, "request").mockRejectedValueOnce(
      new Error("Issue can only have one assignee"),
    );
    await expect(
      issuePatchTool.handler(
        { issueIdOrIdentifier: "TOP-30", assigneeAgentId: "agent-id", assigneeUserId: "user-id" },
        { client },
      ),
    ).rejects.toThrow("Issue can only have one assignee");
  });

  it("rejects bad identifier strings", async () => {
    await expect(
      issuePatchTool.inputSchema.parseAsync({ issueIdOrIdentifier: "not-an-id", status: "done" }),
    ).rejects.toThrow();
  });

  it("rejects when no patchable fields are supplied", async () => {
    await expect(
      issuePatchTool.inputSchema.parseAsync({ issueIdOrIdentifier: "TOP-1" }),
    ).rejects.toThrow();
  });

  it("accepts assigneeUserId alone as a valid patchable field", async () => {
    await expect(
      issuePatchTool.inputSchema.parseAsync({
        issueIdOrIdentifier: "TOP-1",
        assigneeUserId: null,
      }),
    ).resolves.toBeDefined();
  });
});

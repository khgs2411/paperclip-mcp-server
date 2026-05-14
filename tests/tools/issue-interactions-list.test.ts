import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueInteractionsListTool } from "../../src/tools/issue-interactions-list.js";
import { PaperclipClient } from "../../src/client.js";

const MOCK_INTERACTION = {
  id: "i1",
  issueIdentifier: "TOP-10",
  kind: "confirmation",
  status: "pending",
  prompt: "Approve deployment?",
  createdAt: "2026-05-15T00:00:00Z",
  createdByAgentId: "a1",
};

describe("issue_interactions_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/issues/:id/interactions with default status=pending", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([MOCK_INTERACTION]);
    const result = await issueInteractionsListTool.handler(
      { issueId: "TOP-10", status: "pending" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "GET",
      "/api/issues/TOP-10/interactions?status=pending",
    );
    expect(result).toEqual([
      {
        id: "i1",
        issueIdentifier: "TOP-10",
        kind: "confirmation",
        status: "pending",
        prompt: "Approve deployment?",
        createdAt: "2026-05-15T00:00:00Z",
        createdByAgentId: "a1",
      },
    ]);
  });

  it("truncates prompt to 200 chars", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const longPrompt = "x".repeat(300);
    spyOn(client, "request").mockResolvedValueOnce([
      { ...MOCK_INTERACTION, prompt: longPrompt },
    ]);
    const result = (await issueInteractionsListTool.handler(
      { issueId: "TOP-10" },
      { client },
    )) as Array<{ prompt: string }>;
    expect(result[0]!.prompt).toHaveLength(200);
  });

  it("uses default status=pending when omitted", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await issueInteractionsListTool.handler({ issueId: "TOP-5" }, { client });
    expect(spy).toHaveBeenCalledWith(
      "GET",
      "/api/issues/TOP-5/interactions?status=pending",
    );
  });

  it("accepts UUID as issueId", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await issueInteractionsListTool.handler(
      { issueId: "550e8400-e29b-41d4-a716-446655440000" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "GET",
      "/api/issues/550e8400-e29b-41d4-a716-446655440000/interactions?status=pending",
    );
  });
});

import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueInteractionResolveTool } from "../../src/tools/issue-interaction-resolve.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

const MOCK_RESOLVED = { id: "i1", status: "accepted" };

describe("issue_interaction_resolve", () => {
  beforeEach(() => mock.restore());

  it("POSTs to accept endpoint for confirmation+accept", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(MOCK_RESOLVED);
    const result = await issueInteractionResolveTool.handler(
      { issueId: "TOP-10", interactionId: "i1", action: "accept" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "POST",
      "/api/issues/TOP-10/interactions/i1/accept",
      {},
    );
    expect(result).toEqual(MOCK_RESOLVED);
  });

  it("POSTs to reject endpoint for reject action", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(MOCK_RESOLVED);
    await issueInteractionResolveTool.handler(
      { issueId: "TOP-10", interactionId: "i1", action: "reject" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "POST",
      "/api/issues/TOP-10/interactions/i1/reject",
      {},
    );
  });

  it("POSTs to respond endpoint with response body for respond action", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(MOCK_RESOLVED);
    await issueInteractionResolveTool.handler(
      { issueId: "TOP-10", interactionId: "i1", action: "respond", response: "Yes, proceed." },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "POST",
      "/api/issues/TOP-10/interactions/i1/respond",
      { response: "Yes, proceed." },
    );
  });

  it("POSTs to cancel endpoint for cancel action", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(MOCK_RESOLVED);
    await issueInteractionResolveTool.handler(
      { issueId: "TOP-10", interactionId: "i1", action: "cancel" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "POST",
      "/api/issues/TOP-10/interactions/i1/cancel",
      {},
    );
  });

  it("throws ToolInputError when respond action is missing response field", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    spyOn(client, "request").mockResolvedValueOnce(MOCK_RESOLVED);
    await expect(
      issueInteractionResolveTool.handler(
        { issueId: "TOP-10", interactionId: "i1", action: "respond" },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);
  });

  it("rejects invalid action via schema", async () => {
    await expect(
      issueInteractionResolveTool.inputSchema.parseAsync({
        issueId: "TOP-10",
        interactionId: "i1",
        action: "approve",
      }),
    ).rejects.toThrow();
  });
});

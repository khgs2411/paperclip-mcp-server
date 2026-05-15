import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueInteractionAcceptTool } from "../../src/tools/issue-interaction-accept.js";
import { issueInteractionRejectTool } from "../../src/tools/issue-interaction-reject.js";
import { issueInteractionCancelTool } from "../../src/tools/issue-interaction-cancel.js";
import { issueInteractionRespondTool } from "../../src/tools/issue-interaction-respond.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue interaction split tools", () => {
  beforeEach(() => mock.restore());

  it("accept: POSTs to .../accept", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await issueInteractionAcceptTool.handler({ issueId: "TOP-1", interactionId: "I1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/issues/TOP-1/interactions/I1/accept", {});
  });

  it("reject: POSTs to .../reject", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await issueInteractionRejectTool.handler({ issueId: "TOP-1", interactionId: "I1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/issues/TOP-1/interactions/I1/reject", {});
  });

  it("cancel: POSTs to .../cancel", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await issueInteractionCancelTool.handler({ issueId: "TOP-1", interactionId: "I1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/issues/TOP-1/interactions/I1/cancel", {});
  });

  it("respond: POSTs response text to .../respond", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await issueInteractionRespondTool.handler(
      { issueId: "TOP-1", interactionId: "I1", response: "Yes, proceed." },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "POST",
      "/api/issues/TOP-1/interactions/I1/respond",
      { response: "Yes, proceed." },
    );
  });

  it("respond: rejects empty response", async () => {
    await expect(
      issueInteractionRespondTool.inputSchema.parseAsync({ issueId: "TOP-1", interactionId: "I1", response: "" }),
    ).rejects.toThrow();
  });
});

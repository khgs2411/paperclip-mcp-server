import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { inboxDismissTool } from "../../src/tools/inbox-dismiss.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_inbox_dismiss", () => {
  beforeEach(() => {
    mock.restore();
    delete process.env["PAPERCLIP_AGENT_API_KEY"];
  });

  it("POSTs to /api/companies/:cid/inbox-dismissals with interactionId", async () => {
    process.env["PAPERCLIP_AGENT_API_KEY"] = "ak-1";
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "cid1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ dismissed: true });

    const result = await inboxDismissTool.handler(
      { interactionId: "ix-abc" },
      { client },
    );

    expect(spy).toHaveBeenCalledWith(
      "POST",
      "/api/companies/cid1/inbox-dismissals",
      { interactionId: "ix-abc" },
    );
    expect(result).toEqual({ dismissed: true });
  });

  it("throws ToolInputError when PAPERCLIP_AGENT_API_KEY is absent", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "cid1" });
    await expect(
      inboxDismissTool.handler({ interactionId: "ix-abc" }, { client }),
    ).rejects.toBeInstanceOf(ToolInputError);
  });

  it("throws ToolInputError when no companyId available", async () => {
    process.env["PAPERCLIP_AGENT_API_KEY"] = "ak-1";
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(
      inboxDismissTool.handler({ interactionId: "ix-abc" }, { client }),
    ).rejects.toBeInstanceOf(ToolInputError);
  });
});

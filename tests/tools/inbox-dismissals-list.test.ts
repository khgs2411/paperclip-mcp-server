import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { inboxDismissalsListTool } from "../../src/tools/inbox-dismissals-list.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_inbox_dismissals_list", () => {
  beforeEach(() => {
    mock.restore();
    delete process.env["PAPERCLIP_AGENT_API_KEY"];
  });

  it("calls GET /api/companies/:cid/inbox-dismissals when key is set", async () => {
    process.env["PAPERCLIP_AGENT_API_KEY"] = "ak-d";
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "cid1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);

    await inboxDismissalsListTool.handler({}, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/cid1/inbox-dismissals");
  });

  it("uses provided companyId over defaultCompanyId", async () => {
    process.env["PAPERCLIP_AGENT_API_KEY"] = "ak-d";
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "cid1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);

    await inboxDismissalsListTool.handler({ companyId: "cid2" }, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/cid2/inbox-dismissals");
  });

  it("throws ToolInputError when PAPERCLIP_AGENT_API_KEY is absent", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "cid1" });
    await expect(
      inboxDismissalsListTool.handler({}, { client }),
    ).rejects.toBeInstanceOf(ToolInputError);
  });

  it("throws ToolInputError when no companyId available", async () => {
    process.env["PAPERCLIP_AGENT_API_KEY"] = "ak-d";
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(
      inboxDismissalsListTool.handler({}, { client }),
    ).rejects.toBeInstanceOf(ToolInputError);
  });
});

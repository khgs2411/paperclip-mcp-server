import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { inboxMineTool } from "../../src/tools/inbox-mine.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_inbox_mine", () => {
  beforeEach(() => {
    mock.restore();
    delete process.env["PAPERCLIP_AGENT_API_KEY"];
  });

  it("calls GET /api/agents/me/inbox/mine without filter", async () => {
    process.env["PAPERCLIP_AGENT_API_KEY"] = "ak-1";
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([{ id: "i1" }]);

    const result = await inboxMineTool.handler({}, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/me/inbox/mine");
    expect(result).toEqual([{ id: "i1" }]);
  });

  it("appends status filter when provided", async () => {
    process.env["PAPERCLIP_AGENT_API_KEY"] = "ak-1";
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);

    await inboxMineTool.handler({ status: "in_progress" }, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/me/inbox/mine?status=in_progress");
  });

  it("throws ToolInputError when PAPERCLIP_AGENT_API_KEY is absent", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(inboxMineTool.handler({}, { client })).rejects.toBeInstanceOf(ToolInputError);
  });
});

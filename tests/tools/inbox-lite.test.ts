import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { inboxLiteTool } from "../../src/tools/inbox-lite.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_inbox_lite", () => {
  beforeEach(() => {
    mock.restore();
    delete process.env["PAPERCLIP_AGENT_API_KEY"];
  });

  it("calls GET /api/agents/me/inbox-lite when key is set", async () => {
    process.env["PAPERCLIP_AGENT_API_KEY"] = "ak-lite";
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ items: [] });

    const result = await inboxLiteTool.handler({}, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/me/inbox-lite");
    expect(result).toEqual({ items: [] });
  });

  it("throws ToolInputError when PAPERCLIP_AGENT_API_KEY is absent", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(inboxLiteTool.handler({}, { client })).rejects.toBeInstanceOf(ToolInputError);
  });
});

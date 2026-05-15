import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { meWhoamiTool } from "../../src/tools/me-whoami.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_me_whoami", () => {
  beforeEach(() => {
    mock.restore();
    delete process.env["PAPERCLIP_AGENT_API_KEY"];
  });

  it("calls GET /api/agents/me when key is set", async () => {
    process.env["PAPERCLIP_AGENT_API_KEY"] = "test-key";
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "agent-1", name: "Vulcan" });

    const result = await meWhoamiTool.handler({}, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/me");
    expect(result).toEqual({ id: "agent-1", name: "Vulcan" });
  });

  it("throws ToolInputError when PAPERCLIP_AGENT_API_KEY is not set", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(meWhoamiTool.handler({}, { client })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("ToolInputError names the correct field", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    try {
      await meWhoamiTool.handler({}, { client });
    } catch (err) {
      expect((err as ToolInputError).field).toBe("PAPERCLIP_AGENT_API_KEY");
    }
  });
});

import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentResumeTool } from "../../src/tools/agent-resume.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_resume", () => {
  beforeEach(() => mock.restore());

  it("POSTs to agent resume endpoint and returns resumed shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({});

    const result = await agentResumeTool.handler({ agentId: "A1" }, { client });

    expect(requestSpy).toHaveBeenCalledWith("POST", "/api/agents/A1/resume?companyId=C1");
    expect(result).toEqual({ agentId: "A1", resumed: true });
  });

  it("uses overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await agentResumeTool.handler({ agentId: "A1", companyId: "C2" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/agents/A1/resume?companyId=C2");
  });
});
